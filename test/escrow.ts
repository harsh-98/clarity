import { Client, Provider } from "@blockstack/clarity";
import { query, submitTx } from "./utils";

class EscrowClient extends Client {
    submitTx: any;
    query: any;
    constructor(name: string, filePath: string, provider: Provider) {
      super(name, filePath, provider);
      this.submitTx = submitTx.bind(this, this);
      this.query = query.bind(this, this);
    }
    async createAccount(sender: string, {m, n}) {
        return await this.submitTx({
          method: "create",
          sender,
          args: [m,n],
        });
      }
    async getOpenAccounts() {
        return await this.query({
          method: "get-open-accounts",
          args: [],
        });
    }
    async getParticipants(accountNumber: string) {
        return await this.query({
          method: "get-participants",
          args: [accountNumber],
        });
    }
    async getSignatures(accountNumber: string) {
        return await this.query({
          method: "get-signatures",
          args: [accountNumber],
        });
    }
    async getN(accountNumber: string) {
        return await this.query({
          method: "get-n",
          args: [accountNumber],
        });
    }
    async getM(accountNumber: string) {
        return await this.query({
          method: "get-m",
          args: [accountNumber],
        });
    }
    async addParticipant({sender, accountNumber, participant}) {
        return await this.submitTx({
          method: "add-participant",
          sender,
          args: [accountNumber, `'${participant}`],
        });
      }
    async addSignature({sender, accountNumber}) {
        return await this.submitTx({
          method: "add-signature",
          sender,
          args: [accountNumber],
        });
      }
    async setReceiver({sender, accountNumber, receiver}) {
        return await this.submitTx({
          method: "set-receiver",
          sender,
          args: [accountNumber, `'${receiver}`],
        });
      }
    async deposit({sender, accountNumber, amount}) {
        return await this.submitTx({
          method: "deposit",
          sender,
          args: [accountNumber, amount],
        });
      }
    async getReceiver(accountNumber: string) {
        return await this.query({
          method: "get-receiver",
          args: [accountNumber],
        });
      }
    async getBalance(accountNumber: string) {
        return await this.query({
          method: "get-balance",
          args: [accountNumber],
        });
      }

}

export {EscrowClient};