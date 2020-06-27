;; Storage
(define-map account-participants
   ((account uint)) ((participants (list 10 principal))))

(define-map account-signatures
   ((account uint)) ((signatures (list 10 principal))))

(define-data-var open-accounts uint u0)

(define-map account-m
   ((account uint)) ((m uint)) )

(define-map account-n
   ((account uint)) ((n uint)) )

(define-map account-balance
   ((account uint)) ((balance uint)) )

(define-map account-receiver
   ((account uint)) ((receiver principal)) )
(define-map account-closed
   ((account uint)) ((closed bool)) )

(define-map account-owner
   ((account uint)) ((owner principal)) )

;; public functions
(define-read-only (get-open-accounts) (var-get open-accounts))

(define-public (create (m uint) (n uint))
   (begin
      (if (and
            (<= n u10)
            (<= m n)
            (> m u0)
         )
         (let ((account-no (+ (var-get open-accounts) u1) )) 
            (begin
               (map-set account-m
                  ((account account-no))
                  ((m m)) )
               (map-set account-n
                  ((account account-no))
                  ((n n)) )
               (var-set open-accounts account-no)
               (map-set account-owner ((account account-no)) ((owner tx-sender)) )
               (ok account-no)
            )
         )
         (err false)
      )
   )
)


;; error codes
(define-constant not-owner-of-account (err 1))
(define-constant participant-length-exceed (err 2))
(define-constant participant-already-present (err 3))
(define-constant account-not-defined (err 4))
(define-constant receiver-already-set (err 5))
(define-constant receiver-not-set (err 6))
(define-constant not-all-participants-added (err 7))
(define-constant is-not-participant (err 8))
(define-constant signature-already-present (err 9))
(define-constant unknown-error (err 10))
(define-constant not-enough-signatures (err 11))
(define-constant not-receiver-of-account (err 12))
(define-constant not-enough-balance (err 13))

(define-public (get-participants (account-no uint))
   (ok 
      (default-to 
         (list)
         (get participants 
            (map-get? account-participants {account: account-no})
         )
      )
   )
)

(define-public (get-signatures (account-no uint))
   (ok 
      (default-to 
         (list)
         (get signatures
            (map-get? account-signatures {account: account-no})
         )
      )
   )
)
;; unwrap! and default-to are similar to each other but unwrap! exits from current-flow
(define-public (get-m (account-no uint))
   (match (get m (map-get? account-m {account: account-no}))
         output (ok output)
         account-not-defined
   )
)

(define-public (get-n (account-no uint))
   (match (get n (map-get? account-n {account: account-no}))
         output (ok output)
         account-not-defined
   )
)

;; https://docs.blockstack.org/core/smart/principals.html#example-authorization-checks
;; implementing a contains function via fold
(define-private (contains-check 
                  (y principal)
                  (to-check { p: principal, result: bool }))
   (if (get result to-check)
        to-check
        { p: (get p to-check),
          result: (is-eq (get p to-check) y) }))

;; check if the participant is already present
(define-private (contains (x principal) (find-in (list 10 principal)))
   (get result (fold contains-check find-in
    { p: x, result: false })))

(define-private (is-owner (account-no uint))
   (match (get owner 
            (map-get? account-owner ((account account-no)) )
           )
      owner (if (is-eq owner tx-sender) true false)
      false
   )
)

(define-private (is-receiver (account-no uint))
   (match (get receiver 
            (map-get? account-receiver ((account account-no)) )
           )
      receiver (if (is-eq receiver tx-sender) true false)
      false
   )
)

;; adding participants to account-participant
(define-public (add-participant (account-no uint) (participant principal))
   ;; https://docs.blockstack.org/core/smart/clarityref#default-to
   (let ((n (unwrap! (get-n account-no) account-not-defined)))
         (if (is-owner account-no)
            (let ((participants 
                     (default-to 
                        (list)
                        (get participants (map-get? account-participants { account: account-no }))
                     )
                  ))
               (begin
                  (asserts! (not (contains participant participants)) participant-already-present)
                  (match (as-max-len? (concat participants (list participant)) u10)
                           all-participants
                           (if (<= (len all-participants) n) 
                              (ok (map-set account-participants {account: account-no} {participants: all-participants}))
                              participant-length-exceed
                           )
                           participant-length-exceed
                  )
               )
            )
         not-owner-of-account)
   )
)

(define-private (participant-check 
                  (y principal)
                  (to-check { p: principal, result: bool }))
   (if (get result to-check)
        to-check
        { p: (get p to-check),
          result: (is-eq (get p to-check) y) }))

(define-private (is-participant (find-in (list 10 principal)))
   (get result (fold contains-check find-in
    { p: tx-sender, result: false })))

;; add signatures to account
(define-public (add-signature (account-no uint))
   (begin
      (let ((ps (unwrap! (get-participants account-no) unknown-error))
            (m (unwrap! (get-m account-no) account-not-defined))
            (n (unwrap! (get-n account-no) account-not-defined))
            )
         (if (is-eq n (len ps) )
            (if (is-participant ps)
               (let ((signatures
                     (default-to 
                        (list)
                        (get signatures (map-get? account-signatures { account: account-no }))
                     )
                  ))
                  (asserts! (not (contains tx-sender signatures)) signature-already-present)
                  (match (as-max-len? (concat signatures (list tx-sender)) u10)
                     all-signatures
                     (ok (map-set account-signatures 
                           {account: account-no} 
                           {signatures: all-signatures}
                         )
                     )
                  participant-length-exceed)
               )
            is-not-participant)
         not-all-participants-added)
      )
   )
)

(define-private (if-account-closed-then-panic (account-no uint)) 
   (unwrap! 
      (get closed (map-get? account-closed ((account account-no))))
   false)
)

(define-public (deposit (account-no uint) (amount uint))
  (begin
      (if-account-closed-then-panic account-no)
      (stx-transfer? amount tx-sender .m-of-n-escrow)
      (let ((balance 
               (+ amount 
                  (default-to u0 
                     (get balance (map-get? account-balance ((account account-no)) ))
                  )
               )
            ))
            (ok (map-set account-balance 
               ((account account-no))
               ((balance balance)))
            )
      )
  )
)

(define-public (withdraw (account-no uint) (amount uint))
   (begin
      (let ((ss (unwrap! (get-signatures account-no) unknown-error))
            (m (unwrap! (get-m account-no) account-not-defined))
            (balance (unwrap! (get-balance account-no) unknown-error))
            )
            (ok (len ss))
            (if (is-eq m (len ss))
               (if (is-receiver account-no)
                  (if (and (not (is-eq balance u0)) (<= amount balance))
                     (begin
                        (stx-transfer? balance .m-of-n-escrow tx-sender)
                        (ok (map-set account-balance 
                              ((account account-no)) 
                              ((balance (- balance amount))) 
                           )
                        )
                     )
                  not-enough-balance)
               not-receiver-of-account)
            not-enough-signatures)
      )
   )
)

(define-public (set-receiver (account-no uint) (receiver principal))
   (if (is-owner account-no)
      (match 
         (map-get? account-receiver 
            ((account account-no)) )
            ;; if already set return error
         prev-receiver receiver-already-set
         ;; if not set set the receiver principal
         (ok (map-set account-receiver
            ((account account-no))
            ((receiver receiver))
         ))
      )
   not-owner-of-account)
)

(define-public (get-receiver (account-no uint))
   (match   (get receiver
               (map-get? account-receiver ((account account-no))) 
            )
            receiver (ok receiver)
            receiver-not-set)
)

(define-public (get-balance (account-no uint))
   (match (get balance 
            (map-get? account-balance ((account account-no)) )
         )
   balance (ok balance)
   (ok u0)
   )
)