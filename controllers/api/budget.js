const Budget = require('../../models/Budget');
const express = require('express');
const router = express.Router();


router.get('/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const { accountId } = req.session;

  // normalize input, so `01` always becomes `1`
  const date = `${parseInt(year)}/${parseInt(month)}`;

  const foundBudget = await Budget.findOne({
    accountId: accountId,
    date: date,
  });

  if (foundBudget == null) {
    res.status(404).json({ error: 'budget not found' })
    return
  }

  res.status(200).json({
    budgetId: foundBudget._id,
    storeData: JSON.parse(foundBudget.storeData)
  });
});

router.post('/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const { accountId } = req.session;

  // normalize input, so `01` always becomes `1`
  const date = `${parseInt(year)}/${parseInt(month)}`;

  const foundBudget = await Budget.findOne({
    accountId: accountId,
    date: date,
  });

  if (foundBudget) {
    await Budget.findOneAndUpdate(
      { _id: foundBudget._id },
      {
        storeData: req.body.serializedStore,
      }
    );
  } else {
    let newBudget = new Budget({
      accountId,
      date: date,
      storeData: req.body.serializedStore,
    });

    await newBudget.save();
  }

  res.sendStatus(200);
});

router.delete('/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const { accountId } = req.session;

  // normalize input, so `01` always becomes `1`
  const date = `${parseInt(year)}/${parseInt(month)}`;

  await Budget.findOneAndDelete({
    accountId: accountId,
    date: date,
  });

  res.status(200).send('OK');
});

module.exports = router;
