const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const authentication = require('./middleware/authentication');

const app = express();
const port = 8080;

(async () => {
  await require('./db')(); // ensure db is initialized

  app.use((req, res, next) => {
    var allowedDomains = ['http://localhost:8888','http://192.168.1.179' ];
    var origin = req.headers.origin;
    if(allowedDomains.indexOf(origin) > -1){
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  })
  
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


  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
})();
