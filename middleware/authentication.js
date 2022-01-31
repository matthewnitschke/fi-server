module.exports = (req, res, next) => {
  // req.session.accountId = "5fbfe7509a758581b265a7f5";
  // req.session.bankAccountIds = ["someid"]
  // next();
  
  
  if (req.session.accountId != null) {
    console.log(`accountId: ${req.session.accountId}`)
    next();
  } else {
    console.log('Received unauthenticated request')
    res.status(401).send("Not Authenticated");
  }
};
