const path = require('path');

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const authentication = require('./middleware/authentication');

var cors = require('cors')

const app = express();
const port = 8080;

(async () => {
  await require('./db')(); // ensure db is initialized

  app.use(cors())
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'secret-dev-stuff',
      store: new MongoStore({ mongooseConnection: mongoose.connection }),
    })
  );
  
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  
  app.use('/admin', require('./admin/admin.js'));

  app.use('/login', require('./controllers/login'));
  app.use(authentication);
  
  app.use('/budget', require('./controllers/api/budget'));
  app.use('/transactions', require('./controllers/api/transactions'));
  app.use('/plaid', require('./controllers/api/plaid'));
  app.use('/plaid-admin', require('./controllers/api/plaid-admin'));


  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
})();
