const path = require('path');
const express = require("express");
const router = express.Router();

const {plaidClient, plaidEnv} = require('../controllers/api/plaid-utils.js');

const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

// ------------------------------ Static Assets ------------------------------

router.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, './client/index.html'))
});

router.get('/app.js', async (req, res) => {
  res.sendFile(path.join(__dirname, './client/app.js'))
});

// ------------------------------- Api Calls --------------------------------

router.get('/accounts', async (req, res) => {
  const { email } = req.query;

  let accounts = await Account.find({
    ...(!!email && {
      email: { $regex: email, $options: "i" },
    }),
  });

  res.status(200).json(
    accounts.map(({ _id, email, plaidAccessToken, lastLogin }) => {
      return {
        accountId: _id,
        email,
        plaidAccessToken,
        lastLogin,
      };
    })
  );
});

router.post('/setPlaidAccessToken', async (req,res) => {
  const { accountId, plaidAccessToken } = req.body;

  if (plaidAccessToken == null || plaidAccessToken == '') {
    res.status(500).json({ error: 'unable to set a null access token'})
  }

  await Account.updateOne(
    { _id: accountId },
    { plaidAccessToken }
  )

  res.sendStatus(200);
})

router.post("/testPlaidApiConnection", async (req, res) => {
  const { accountId } = req.body;

  let account = await Account.findOne({ _id: accountId });

  plaidClient.getAccounts(account.plaidAccessToken, (error, accountsResp) => {
    if (error != null) {
      console.error(error);
      return res.status(500).json({
        error,
      });
    }
    console.log(accountsResp)
    res.status(200).json(accountsResp);
  });
});


router.all("/plaidEnv", (req, res) => res.status(200).json({env: plaidEnv}))

router.post('/syncTransactions', async (req, res) => {
  const { year, month, accountId } = req.body;

  function padZero(num) {
    return num <= 9 ? `0${num}` : num
  }

  const from = `${year}-${padZero(month)}-01`
  const to = `${year}-${padZero(month)}-${padZero(new Date(year, month, 0).getDate())}`

  console.log(from, to, accountId);
  
  let account = await Account.findOne({ _id: accountId });
  
  if (account.plaidAccessToken == null) {
    return res.status(500).json({
      error: 'Plaid ACCESS_TOKEN not initialized. If just set, try logging in and out again.'
    })
  }

  if (!from || !to) {
    return res.status(500).json({
      error: 'missing "from" or "to" query parameters'
    })
  }

  try {
    let response = await plaidClient.getTransactions(
      account.plaidAccessToken,
      from,
      to,
      {
        // account_ids: [],
        // count: 0,
        // offset: 0
      }
    );

    await Transaction.bulkWrite(
      response.transactions.map(transaction => ({
        updateOne: {
          filter: { _id: transaction.transaction_id },
          update: {
            _id: transaction.transaction_id,
            fiAccountId: accountId,
        
            date: transaction.date,
            name: transaction.name,
            merchantName: transaction.merchant_name,
            amount: transaction.amount,
            isPending: transaction.pending,

            raw: transaction
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

  } catch(e) {
    console.error(e)
    return res.status(500).json({
      error: e
    });
  }

  res.status(200).send('OK')
});


router.post('/newAccount', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      message: "Missing email or password"
    })
  }

  let newAccount = new Account({
    email,
  });

  newAccount.setPassword(password);

  newAccount.save((err) => {
    if (err) {
      return res.status(400).send({
        message: 'Failed to add account.',
      });
    } else {
      return res.status(201).send({
        message: 'Account added successfully.',
      });
    }
  });
});

router.delete('/deleteAccount', async (req, res) => {
  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).send({
      message: "Missing accountId"
    })
  }

  await Account.deleteOne(
    { _id: accountId },
    function (err) {
      if (err) {
        return res.status(400).send({
          message: 'Failed to delete',
        });
      }

      return res.status(201).send({
        message: 'Account deleted successfully',
      });
    }
  );
});

module.exports = router;
