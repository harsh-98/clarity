import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";
import {EscrowClient} from "./escrow";
const addrs = [
  "ST37X0038BZV6YV0MQCJ0G6QMZZ75QS64KA69V9D",
  "SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR",
  "ST1BG7MHW2R524WMF7X8PGG3V45ZN040EB9EW0GQJ",
  "SP1EHFWKXQEQD7TW9WWRGSGJFJ52XNGN6MTJ7X462",
  "SP30JX68J79SMTTN0D2KXQAJBFVYY56BZJEYS3X0B"
]
describe("M of N Escrow Contract test suite", () => {
  let escrowClient:  EscrowClient;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    escrowClient = new EscrowClient("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.m-of-n-escrow", "m-of-n-escrow", provider);
  });

  it("should have a valid syntax", async () => {
    await escrowClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await escrowClient.deployContract();
    });

    it("check number of open accounts after contract deployment, which should be 0 ", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getOpenAccounts();
      assert.equal(result, "u0");
    });
    it("check M of undefined escrow account ", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getM("u1");
      // errorcode 4 means that the account is not defined
      assert.equal(result, "(err 4)");
    });

    it("check N of undefined escrow account ", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getN("u1");
      // errorcode 4 means that the account is not defined
      assert.equal(result, "(err 4)");
    });

  });
  describe("create first m-of-n escrow account", () => {

    it("check number of open accounts after creating an escrow account", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.createAccount(addrs[0], {m: "u1",n:"u1"});
      assert.equal(result, "u1");
    });

    it("check M of created escrow account ", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getM("u1");
      // errorcode 4 means that the account is not defined
      assert.equal(result, "(ok u1)");
    });

    it("check N of created escrow account ", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getN("u1");
      // errorcode 4 means that the account is not defined
      assert.equal(result, "(ok u1)");
    });
  
    it("check participants before adding them", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getParticipants("u0");
      assert.equal(result, "(ok ())");
      // assert.equal(result, "u1");
    });
    it("add participants to account 1", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u1", participant: addrs[1]});
      
      // returns true as the participant is added
      assert.equal(result, "true");
    });
    it("try to add again the same participant to account 1. This returns errorcode 3.", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.addParticipant({sender: addrs[0], accountNumber: "u1", participant: addrs[1]});
      
      // this call returns error code 3, which means the participant is already present.
      assert.equal(result, "3");
    });
    it("Non-owner account is trying to add participants. This returns errorcode 1.", async () => {
      // for passing uint prefix with u and for principal prefix with '
      const result = await escrowClient.addParticipant({sender: addrs[1], accountNumber: "u1", participant: addrs[2]});
      
      // this call returns error code 3, which means the participant is already present.
      assert.equal(result, "1");
    });

    it("get participants for escrow account 1", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getParticipants("u1");
      assert.equal(result, `(ok (${addrs[1]}))`);
    });

    it("receiver not set before the owner sets it", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.getReceiver("u1");
      assert.equal(result, `(err 6)`);
    });

    it("only owner can set the receiver address", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.setReceiver({sender: addrs[1], accountNumber: "u1", receiver: addrs[4]});
      assert.equal(result, `1`);
    });
    it("Set receiver and check if the value matches", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.setReceiver({sender: addrs[0], accountNumber: "u1", receiver: addrs[4]});
      assert.equal(result, `true`);
    });
    it("Even owner can't set the receiver address twice", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.setReceiver({sender: addrs[0], accountNumber: "u1", receiver: addrs[4]});
      // errorcode 5 means receiver address is already set
      assert.equal(result, `5`);
    });

  });
  after(async () => {
    await provider.close();
  });
});
