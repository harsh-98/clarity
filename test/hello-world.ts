import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity";
import { assert } from "chai";

describe("hello world contract test suite", () => {
  let escrowClient: Client;
  let provider: Provider;

  before(async () => {
    provider = await ProviderRegistry.createProvider();
    escrowClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.m-of-n-escrow", "m-of-n-escrow.clar", provider);
  });

  it("should have a valid syntax", async () => {
    await escrowClient.checkContract();
  });

  describe("deploying an instance of the contract", () => {
    before(async () => {
      await escrowClient.deployContract();
    });

    it("create first m-of-n escrow account", async () => {
      const query = escrowClient.createQuery({ method: { name: "create", args: [`2`,`3`] } });
      const response = await escrowClient.submitQuery(query);
      const result = Result.unwrap(response);
      assert.equal(result, "(ok u1)");
    });

  });

  after(async () => {
    await provider.close();
  });
});
