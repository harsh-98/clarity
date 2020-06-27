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

}

export {EscrowClient};