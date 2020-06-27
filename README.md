# M-of-N Escrow Contract
This contract is written in clarity is extending basic [escrow@friedger](https://github.com/friedger/clarity-smart-contracts/blob/master/contracts/tokens/escrow.clar). 

### New features:

- Instead of having fixed m and n for escrow, this values can now be defined by users for their use-case. Since clarity doesn't allow list with arbitary length. The upper cap for m and n is 10.

- Any number of escrow accounts can be created. Multiple groups can tune the account with parameters for their use-case.

- Owner (created of the contract) has roles of setting the receiver that's it. Adding funds or the signature (i.e. approving the spending of funds) is controlled by participants.

- Receiver address is set before depositing. Trying to deposit before setting receiver address, will error with `receiver-not-set`. This uses the participants the fixability to backout if the receiver is not whom they want.

## Outline of contract

### Public functins exposed

#### Getter functions

- `get-open-accounts`: function for geting the total number of open escrow accounts
- `get-participants`: get the list of the participants added by owner for this account. There number is less than or equal to the N set during creation of contract.
-  `get-signatures`: get the signatures, minimum M signatues are required for transferring the funds to the receiver.
- `get-m`: For getting the M, set while creation of contract.
- `get-n`: For getting N parameter of escrow account.
- `get-receiver`: The receiver is the principal to whom we want to transfer funds with consensus of atleast M principal out of N.
- `get-balance`: It is the sum of the deposit done to that account.

#### Setter functions
This functions are capable of modifying the data stored by the contract.

- `create`: Calling this function result in the creation of the contract. The tx-sender is set as the owner of the contract.
- `add-participants`: for adding participants for each account. Participants for each account should be less than N for that account. There is also upper cap on the N which 10
- `add-signatures`: for adding signatures, which are required for approving the transfer of funds to receiver.
- `deposit`: this can be called by anyone to add funds. Keeping it open is important for use-case like a climate relief or health crisis. The general public can deposit to this account if they believe in the majority of participants for spending the funds for mentioned cause.
- `withdraw`: Receiver address set can withdraw funds.
- `set-receiver`: It is done before depositing funds so that participants can backout if they don't funds to be used for this.

#### Errors
|  Errorcode   |     Meaning                    |
|-----|-----------------------|
|  1 | not-owner-of-account   |
|  2 | participant-length-exceed  |
|  3 | participant-already-present    |
|  4 | account-not-defined    |
|  5 | receiver-already-set   |
|  6 | receiver-not-set   |
|  7 | not-all-participants-added     |
|  8 | is-not-participant     |
|  9 | signature-already-present  |
| 10 | unknown-error      |
| 11 | not-enough-signatures      |
| 12 | not-receiver-of-account    |
| 13 | not-enough-balance     |

### Testing module
Clarity is among best contract languages with primarily focus on security and writting robust contract logic. It's project skeleton comes with testing modules.

I have written test for testing varies functionalities of the escrow account.

![test-result](docs/test.png)

### References

- https://docs.blockstack.org/core/smart/principals.html#example-authorization-checks # for example on how to use fold in clarity
- https://docs.blockstack.org/core/smart/clarityref # documentation of calrity language
- https://github.com/blockstack/clarity-js-sdk # clarity js sdk
- how to write test for clarity # https://docs.blockstack.org/core/smart/tutorial-test.html