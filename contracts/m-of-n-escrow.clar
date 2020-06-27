;; Storage
(define-map account-participants
   ((account uint)) ((participants (list 10 principal))))

(define-map account-signatures
   ((account uint)) ((signatures (list 10 principal))))

(define-data-var total-open-accounts uint u0)

(define-map account-m
   ((account uint)) ((m uint)) )

(define-map account-n
   ((account uint)) ((n uint)) )

(define-map account-owner
   ((account uint)) ((owner principal)) )

;; public functions

(define-public (create (m uint) (n uint))
   (begin
      (if (and
            (<= n u10)
            (<= m n)
            (> m u0)
         )
         (let ((account-no (+ (var-get total-open-accounts) u1) )) 
            (begin
               (map-set account-m
                  ((account account-no))
                  ((m m)) )
               (map-set account-n
                  ((account account-no))
                  ((n n)) )
               (var-set total-open-accounts account-no)
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

;; adding participants to account-participant
;; (define-public (add-participant (account-no uint) (participant principal))
;;    (let ((m 
;;             (get type
;;                (map-get? account-m ((account account-no)) ) 
;;             )
;;          ))
;;       (let ((owner 
;;             (get owner
;;                (map-get? account-owner ((account account-no)) ) 
;;             )
;;          ))
;;          (if (is-eq tx-sender owner)
;;             (let ((participants 
;;                      (default-to 
;;                         (list)
;;                         (get participants (map-get? account-participants { account: account-no }))
;;                      )
;;                   ))
;;                (begin
;;                   (match (as-max-len? (append paritipants participant) m)
;;                            all-participants
;;                            (ok (map-set account-participants {account: account-no} {participants: all-participants}))
;;                            participant-length-exceed
;;                   )
;;                )
;;             )
;;          not-owner-of-account)
;;       )
;;    )
;; )




