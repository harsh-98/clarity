import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";
import {EscrowClient} from "./escrow";
const addrs = [
  "ST37X0038BZV6YV0MQCJ0G6QMZZ75QS64KA69V9D",
]
describe("hello world contract test suite", () => {
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

    it("create first m-of-n escrow account", async () => {
      // for passing uint prefix with u and for principal prefix with u
      const result = await escrowClient.createAccount(addrs[0], {m: "u2",n:"u3"});
      assert.equal(result, "u1");
    });

  });

  after(async () => {
    await provider.close();
  });
});
