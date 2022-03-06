const plaid = require('plaid');

const Transaction = require("../../models/Transaction");
const Account = require("../../models/Account");

const plaidEnv = plaid.environments.development;

const plaidClient = new plaid.Client({
  clientID: process.env.PLAID_CLIENT_ID,
  secret: process.env.PLAID_SECRET,
  env: plaid.environments.development,
  options: {
    version: "2019-05-29",
  },
});

async function syncTransactions({ from, to, accountId }) {
  let account = await Account.findOne({ _id: accountId });

  if (account.plaidAccessToken == null) {
    throw Error('Plaid ACCESS_TOKEN not initialized. If just set, try logging in and out again.');
  }

  if (!from || !to) {
    throw Error('missing "from" or "to" query parameters');
  }

  function padZero(num) {
    return num <= 9 ? `0${num}` : num
  }

  const fromStr = `${from.getFullYear()}-${padZero(from.getMonth()+1)}-01`
  const toStr = `${to.getFullYear()}-${padZero(to.getMonth()+1)}-${padZero(new Date(to.getFullYear(), to.getMonth() + 1, 0)).getDate()}`

  try {
    let response = await plaidClient.getTransactions(
      account.plaidAccessToken,
      fromStr,
      toStr,
      {}
    );

    await Transaction.bulkWrite(
      response.transactions.map(transaction => ({
        updateOne: {
          filter: { _id: transaction.transaction_id },
          update: {
            '$set': {
              _id: transaction.transaction_id,
              fiAccountId: accountId,

              date: transaction.date,
              name: transaction.name,
              merchantName: transaction.merchant_name,
              amount: transaction.amount,
              isPending: transaction.pending,
            }
          },
          upsert: true,
        }
      }))
    );

    await Account.updateOne({
      _id: accountId,
    }, {
      lastTransactionsSync: new Date(),
    });

  } catch (e) {
    console.error(e)
    throw e;
  }
}

module.exports = { plaidClient, plaidEnv, syncTransactions }