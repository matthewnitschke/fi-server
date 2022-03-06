const { syncTransactions } = require('./plaid-utils');

const Transaction = require('../../models/Transaction');
const Account = require("../../models/Account");

const express = require('express');
const router = express.Router();

router.get('/:budgetId', async (req, res) => {
  const { budgetId } = req.params;
  
  let account = await Account.findOne({
    _id: req.session.accountId
  });

  let lastHour = new Date().setHours(new Date().getHours() - 1);
  if (account.lastTransactionsSync - lastHour <= 0) {
    let from = new Date();
    from.setMonth(new Date().getMonth() - 1);
    await syncTransactions({
      accountId: req.session.accountId,
      from: from,
      to: new Date()
    })
  }
  
  let transactions = await Transaction.find({
    fiAccountId: req.session.accountId,
    $and: [
      { $or: [{budgetId}, {budgetId: null}]},
      { $or: [{isIgnored: false}, {isIgnored: null}]},
    ],
  });

  res.status(200).send(transactions);
});

router.get('/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  let transaction = await Transaction.findOne({
    _id: transactionId,
    fiAccountId: req.session.accountId,
  });

  res.status(200).json(transaction);
});

router.post('/:transactionId/ignore', async (req, res) => {
  const { transactionId } = req.params;

  await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      fiAccountId: req.session.accountId,
    },
    { isIgnored: true }
  );

  res.sendStatus(200);
});

router.post('/:transactionId/assign/:budgetId', async (req, res) => {
  const { transactionId } = req.params;

  await Transaction.findOneAndUpdate(
    {
      _id: transactionId,
      fiAccountId: req.session.accountId,
    },
    {
      isIgnored: true
    }
  );

  res.sendStatus(200);
});


module.exports = router;
