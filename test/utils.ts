const REG_ERROR = /Aborted: (.*)$/
const REG_RESP = /Returned: (.*)\n/
function extractErrorCode(raw: string) {
	if (!raw) {
		return null
	}
	const m = raw.match(REG_ERROR)
	return m && m[1]
}
function extractResp(raw: string) {
	if (!raw) {
		return null
	}
	const m = raw.match(REG_RESP)
	return m && m[1]
}
async function submitTx(client, { method, args = [], sender }) {
	const tx = client.createTransaction({
		method: {
			name: method,
			args,
		},
	})
	await tx.sign(sender)
	const receipt = await client.submitTransaction(tx)
	if (receipt.success) {
		return extractResp(receipt.result)
	} else {
		const errCode = extractErrorCode(receipt.error.commandOutput)
		//   console.log(errCode);
		//   console.log(receipt);
		return errCode 
	}
}
async function query(client, { method, args = [] }) {
	const query = client.createQuery({
		method: { name: method, args },
	})
	const receipt = await client.submitQuery(query)
	if (receipt.success) {
		return receipt.result
	} else {
		return null
	}
}
export {  submitTx, query }