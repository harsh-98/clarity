import {  Provider, ProviderRegistry } from "@blockstack/clarity"
import { assert } from "chai"
import {EscrowClient} from "./escrow"
const addrs = [
	"ST37X0038BZV6YV0MQCJ0G6QMZZ75QS64KA69V9D",
	"SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",
	"ST1BG7MHW2R524WMF7X8PGG3V45ZN040EB9EW0GQJ",
	"SP1EHFWKXQEQD7TW9WWRGSGJFJ52XNGN6MTJ7X462",
	"SP30JX68J79SMTTN0D2KXQAJBFVYY56BZJEYS3X0B",
	"SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD",
]
describe("M of N Escrow Contract test suite", () => {
	let escrowClient:  EscrowClient
	let provider: Provider

	before(async () => {
		provider = await ProviderRegistry.createProvider()
		escrowClient = new EscrowClient("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.m-of-n-escrow", "m-of-n-escrow", provider)
	})

	it("should have a valid syntax", async () => {
		await escrowClient.checkContract()
	})

	describe("deploying an instance of the contract", () => {
		before(async () => {
			await escrowClient.deployContract()
		})

		it("check number of open accounts after contract deployment, which should be 0 ", async () => {
			const result = await escrowClient.getOpenAccounts()
			assert.equal(result, "u0")
		})
		it("check M of undefined escrow account ", async () => {
			const result = await escrowClient.getM("u1")
			// errorcode 4 means that the account is not defined
			assert.equal(result, "(err 4)")
		})

		it("check N of undefined escrow account ", async () => {
			const result = await escrowClient.getN("u1")
			// errorcode 4 means that the account is not defined
			assert.equal(result, "(err 4)")
		})

	})


	describe("create first m-of-n escrow account", () => {

		it("check number of open accounts after creating an escrow account", async () => {
			// open a new escrow account 2-of-3
			const result = await escrowClient.createAccount(addrs[0], {m: "u2",n:"u3"})
			assert.equal(result, "u1")
		})

		it("check M of created escrow account ", async () => {
			// get M for the account 1
			const result = await escrowClient.getM("u1")
			// errorcode 4 means that the account is not defined
			assert.equal(result, "(ok u2)")
		})

		it("check N of created escrow account ", async () => {
			// get N for the account 1
			const result = await escrowClient.getN("u1")
			// errorcode 4 means that the account is not defined
			assert.equal(result, "(ok u3)")
		})
	})

	describe("check adding participants", () => {
		it("check participants before adding them to account 1", async () => {
			// check participants list for account 1
			const result = await escrowClient.getParticipants("u0")
			assert.equal(result, "(ok ())")
			// assert.equal(result, "u1");
		})
		it("add participants to account 1", async () => {
			const result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u1", participant: addrs[1]})
      
			// returns true as the participant is added
			assert.equal(result, "true")
		})
		it("try to add the same participant again to account 1. This returns errorcode 3.", async () => {
      
			const result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u1", participant: addrs[1]})
      
			// this call returns error code 3, which means the participant is already present.
			assert.equal(result, "3")
		})
		it("Non-owner account is trying to add participants. This returns errorcode 1.", async () => {
			// only owner can et the participants of contract
			const result = await escrowClient.addParticipant({sender: addrs[1], accountNumber: "u1", participant: addrs[2]})
      
			// this call returns error code 1, which means sender is not the owner of account.
			assert.equal(result, "1")
		})
    
		it("get participants for escrow account 1", async () => {
			// fetch all the participants of the account
			const result = await escrowClient.getParticipants("u1")
			assert.equal(result, `(ok (${addrs[1]}))`)
		})
		it("Add second participant to 2-of-3 escrow account", async () => {
			const result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u1", participant: addrs[2]})
      
			// this works as this is second participant , and the cap for participants in 2-of-3 escrow is 3.
			assert.equal(result, "true")
		})
		it("Add third participant to 2-of-3 escrow account", async () => {
			const result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u1", participant: addrs[3]})
			assert.equal(result, "true")
		})

		it("get all participants for escrow account 1", async () => {
			// fetch all the participants of the account
			const result = await escrowClient.getParticipants("u1")
			assert.equal(result, `(ok (${addrs[1]} ${addrs[2]} ${addrs[3]}))`)
		})

		it("trying  to more than `N` participants 2-of-3 escrow account fails with errorcode 2", async () => {
			const result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u1", participant: addrs[4]})
			// errorcode 1 means participant-length-exceed
			assert.equal(result, "2")
		})

	})

	describe("setting receiver address for escrow account", () => {

		it("receiver not set before the owner sets it", async () => {
			const result = await escrowClient.getReceiver("u1")
			assert.equal(result, "(err 6)")
		})

		it("only owner can set the receiver address", async () => {
			const result = await escrowClient.setReceiver({sender: addrs[1], accountNumber: "u1", receiver: addrs[4]})
			assert.equal(result, "1")
		})

		it("Set receiver and check if the receiver and block-height for account are set", async () => {
			let result = await escrowClient.setReceiver({sender: addrs[0], accountNumber: "u1", receiver: addrs[4]})
			assert.equal(result, "true")
			result = await escrowClient.getBlockHeight("u1")
			assert.notEqual(result, "(ok u0)")
		})
 
		it("even owner can't set the receiver address twice within same epoch", async () => {
			const result = await escrowClient.setReceiver({sender: addrs[0], accountNumber: "u1", receiver: addrs[4]})
			// errorcode 5 means receiver address is already set
			assert.equal(result, "5")
		})
	})
  
	describe("deposit amount in the escrow account", () => {
		it("check balance before adding balance", async () => {
			const result = await escrowClient.getBalance("u1")
			assert.equal(result, "(ok u0)")
		})
		it("deposit amount", async () => {
			const result = await escrowClient.deposit({sender: addrs[2], accountNumber: "u1", amount:"u1000"})
			assert.equal(result, "true")
		})
		it("check balance after first deposit", async () => {
			const result = await escrowClient.getBalance("u1")
			assert.equal(result, "(ok u1000)")
		})

		it("check if anyone can deposit", async () => {
			const result = await escrowClient.deposit({sender: addrs[3], accountNumber: "u1", amount:"u1000"})
			assert.equal(result, "true")
		})
		it("check balance after second deposit", async () => {
			const result = await escrowClient.getBalance("u1")
			assert.equal(result, "(ok u2000)")
		})
  })

	describe("Next epoch", () => {
    const HEIGHT_PER_EPOCH =10

    it("Add signatures for current epoch.", async () => {
			const result = await escrowClient.addSignature({sender: addrs[1], accountNumber: "u1"})
			assert.equal(result, "true")
    })

    it("Once every epoch, owner can set address and get new height", async () => {
      // get old height for account 1
      let oldheight = await escrowClient.getBlockHeight("u1")
      assert.notEqual(oldheight, "(ok u0)")

      // enter new epoch by increasing blockchain height by 10
			for(let i=0 ; i < HEIGHT_PER_EPOCH-5; i++) {
        await escrowClient.setReceiver({sender: addrs[0], accountNumber: "u1", receiver: addrs[4]})
      }

			// set address in next epoch
			let result = await escrowClient.setReceiver({sender: addrs[0], accountNumber: "u1", receiver: addrs[4]})
			assert.equal(result, "true")
			// set new height set by calling set-receiver
      result = await escrowClient.getBlockHeight("u1")
      // check if the height for account has changed or not
			assert.notEqual(oldheight, result)
    })
    it("Every new signatures are reset.", async () => {
    let result = await escrowClient.getSignatures("u2")
    assert.equal(result, `(ok ())`)
  })
  })

	describe("Second escrow Account with 3-of-4.", () => {
		it("create second account and add 2 participants", async () => {
			let result = await escrowClient.createAccount(addrs[0], {m: "u3",n:"u4"})
			assert.equal(result, "u2")
			result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u2", participant: addrs[1]})
			assert.equal(result, "true")
			result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u2", participant: addrs[2]})
			assert.equal(result, "true")
		})
		it("trying to add signatures before adding `N` participants fails.", async () => {
			const result = await escrowClient.addSignature({sender: addrs[1], accountNumber: "u2"})
			// errorcode 7 means not-all-participants-added
			assert.equal(result, "7")
		})
		it("add 2 more participants and add receiver address", async () => {
			let result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u2", participant: addrs[3]})
			assert.equal(result, "true")
			result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u2", participant: addrs[4]})
			assert.equal(result, "true")
		})
		it("try depositing before setting reciever fails with errorcode 6", async () => {
			const result = await escrowClient.deposit({sender: addrs[1], accountNumber: "u2", amount: "u2000"})
			// errorcode 6 means that receiver address is not set
			assert.equal(result, "6")
		})
		it("Set receiver and check if the value matches", async () => {
			let  result = await escrowClient.setReceiver({sender: addrs[0], accountNumber: "u2", receiver: addrs[5]})
			assert.equal(result, "true")
			result = await escrowClient.getReceiver("u2")
			assert.equal(result, `(ok ${addrs[5]})`)
		})
	})

	describe("Check signatures feature", () => {
		it("add 1 singature", async () => {
			const result = await escrowClient.addSignature({sender: addrs[1], accountNumber: "u2"})
			assert.equal(result, "true")
		})

		it("adding same singature fails with errorcode 9", async () => {
			// errorcode 9 means signature-already-present
			const result = await escrowClient.addSignature({sender: addrs[1], accountNumber: "u2"})
			assert.equal(result, "9")
		})

		it("add 1 more signature and get all signatures", async () => {
			let result = await escrowClient.addSignature({sender: addrs[2], accountNumber: "u2"})
			assert.equal(result, "true")
			result = await escrowClient.getSignatures("u2")
			assert.equal(result, `(ok (${addrs[1]} ${addrs[2]}))`)
		})
	})
  
	describe("Withdraw by receiver", () => {
		it("try to withdraw with 2 signatures instead of 3 fails with errorcode 11", async () => {
			let result = await escrowClient.deposit({sender: addrs[1], accountNumber: "u2", amount:"u2000"})
			assert.equal(result, "true")
			result = await escrowClient.withdraw({sender: addrs[5], accountNumber: "u2", amount: "u1000"})
			// errorcode 11 means not-enough-signatures 
			assert.equal(result, "11")
		})

		it("add 1 more signature and withdraw", async () => {

			let result = await escrowClient.addSignature({sender: addrs[3], accountNumber: "u2"})
			assert.equal(result, "true")

			// get signature can check the added 3 signatures
			result = await escrowClient.getSignatures("u2")
			assert.equal(result, `(ok (${addrs[1]} ${addrs[2]} ${addrs[3]}))`)

			// if balance is there, tx-sender is receiver, minimum m signatures are there
			// then funds can be withdraw by receiver 
			result = await escrowClient.withdraw({sender: addrs[5], accountNumber: "u2", amount: "u1000"})
			assert.equal(result, "true")
		})

		it("non-receiver trying to withdraw fails with errorcode 12", async () => {
    
			const result = await escrowClient.withdraw({sender: addrs[1], accountNumber: "u2", amount: "u1000"})
			// errorcode 12 means not-receiver-of-account
			assert.equal(result, "12")
		})
		it("try to withdraw more than balance", async () => {
    
			const result = await escrowClient.withdraw({sender: addrs[5], accountNumber: "u2", amount: "u2000"})
			// errorcode 13 means not-enough-balance
			assert.equal(result, "13")
		})

		it("empty account and check balance", async () => {
    
			let result = await escrowClient.withdraw({sender: addrs[5], accountNumber: "u2", amount: "u1000"})
			assert.equal(result, "true")

			result = await escrowClient.getBalance("u2")
			assert.equal(result, "(ok u0)")
		})
		it("trying to withdraw from empty account returns 13", async () => {
    
			const result = await escrowClient.withdraw({sender: addrs[5], accountNumber: "u2", amount: "u1000"})
			// errorcode 13 means not-enough-balance 
			assert.equal(result, "13")
		})
	})
	after(async () => {
		await provider.close()
	})
})
