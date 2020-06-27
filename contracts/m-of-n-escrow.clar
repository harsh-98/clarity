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

(define-private (is-owner (owner principal))
   (is-eq tx-sender owner)
)

;; error codes
(define-constant not-owner-of-account (err 1))
(define-constant participant-length-exceed (err 2))
(define-constant participant-already-present (err 3))
(define-constant account-not-defined (err 4))

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

;; (define-private (add-principal 
;;                   (p principal)
;;                   (plist (list 10 principal) ))
;;    append(plist p))

;; (define-private (add-p (x principal) (prev-p (list 10 principal)))
;;    (fold add-principal prev-p (list (x)) ))

;; adding participants to account-participant
(define-public (add-participant (account-no uint) (participant principal))
   ;; https://docs.blockstack.org/core/smart/clarityref#default-to
   (let ((n 
            (default-to u0
               (get n
                  (map-get? account-n ((account account-no)) ) 
               )
            )
         )
         (owner 
            (get owner
               (map-get? account-owner ((account account-no)) ) 
            )
         ))
         (if (is-eq (some tx-sender) owner)
            (let ((part 
                     (default-to 
                        (list)
                        (get participants (map-get? account-participants { account: account-no }))
                     )
                  ))
               (begin
                  (asserts! (not (contains participant part)) participant-already-present)
                  ;; (ok (len participants))
                  (match (as-max-len? (append part participant) u10)
                           all-participants
                           (if (< (len all-participants) n) 
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




