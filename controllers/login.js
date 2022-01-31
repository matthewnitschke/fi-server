const express = require('express');
const router = express.Router();

const Account = require('../models/Account');

router.post('/authenticate', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    console.log("Missing email or password")
    return res.status(400).send({
      message: "Missing email or password"
    })
  }

  let account = await Account.findOne({
    email,
  });

  if (account === null) {
    console.log('User not found')
    return res.status(400).send({
      message: 'User not found',
    });
  }

  if (account.isValidPassword(password)) {
    // valid password, add the session vars
    req.session.accountId = account._id;
    req.session.plaidAccessToken = account.plaidAccessToken;

    console.log(`Authorizing: ${req.session.accountId}`)

    account.lastLogin = new Date()
    account.save();
    
    return res.status(201).send({
      message: 'Authenticated!',
    });
  } else {
    console.log("Wrong password")
    return res.status(400).send({
      message: 'Wrong Password',
    });
  }
});

router.post('/signup', async (req, res) => {
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
        message: 'Failed to add user.',
      });
    } else {
      return res.status(201).send({
        message: 'User added successfully.',
      });
    }
  });
});

router.all('/logout', async (req, res) => {
  req.session.destroy();

  res.status(200).send({
    message: 'User logged out successfully',
  });
});

module.exports = router;
