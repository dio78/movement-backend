if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
// const parse = require('pg-connection-string').parse;
const http = require('http');
const bodyParser = require('body-parser');

const { pool } = require('./queries/queries');

const { requireSignin, requireAuth } = require('./services/authentication')

const defaultRouter = require('./routes/routes');
const { signin, signup } = require('./routes/sign-in')

const app = express();

app.use(
  cors({
    origin: '*',
  })
);
// app.use(bodyParser.json());
// app.use(bodyParser.json({limit: '50mb'}));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));


const queries = require('./queries/queries')


// Routes
app.get('/test', (req, res) => res.send('I work!'));
app.post('/auth/sign-in', requireSignin, signin);
app.post('/auth/sign-up', signup);
app.use('/api', requireAuth, defaultRouter)
app.get('/tables', queries.setUpTables)


const port = process.env.PORT || 8000;
const server = http.createServer(app);
server.listen(port);
console.log('Server listening on:', port);

module.exports = app;