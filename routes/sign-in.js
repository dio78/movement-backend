const { pool } = require('../queries/queries')
const jwt = require('jwt-simple')
const keys = require('../config/keys');
const mailjet = require ('node-mailjet')
.connect(process.env.API_KEY, process.env.SECRET_KEY)

function tokenForUser(user) {
  return jwt.encode({ 
    sub: user.user_id,
    iat: Math.round(Date.now() / 1000),
    exp: Math.round(Date.now() / 1000 + 5 * 60 * 60)}, keys.TOKEN_SECRET)
};

exports.signin = function(req, res, next) {
  res.send({
    user: {
      user_id: req.user.user_id,
      username: req.user.username,
      email: req.user.email
    },
    token: tokenForUser(req.user)
  });
};

exports.currentUser = function(req, res) {
  const user = {
    email: req.user.email,
    token: tokenForUser(req.user)
  };

  res.send(user);
}

exports.signup = function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const username = req.body.username;

  console.log(email);

  if(!email || !password) {
    return res.status(422).send({ error: 'You must provide email, username, and password'});
  }

  const checkForUserQuery = ( email, username ) => ({
    text: `
    SELECT *
    FROM movers
    WHERE 
      email = $1 OR
      username = $2
    `,
    values: [email, username]
  })

  const sendEmail = () => {

    const request = mailjet
    .post("send", {'version': 'v3.1'})
    .request({
      "Messages":[
        {
          "From": {
            "Email": "cdebon97@gmail.com",
            "Name": "Dio"
          },
          "To": [
            {
              "Email": "cdebon97@gmail.com",
              "Name": "Dio"
            }
          ],
          "Subject": "Greetings from Mailjet.",
          "TextPart": "My first Mailjet email",
          "HTMLPart": "<h3>Dear passenger 1, welcome to <a href='https://www.mailjet.com/'>Mailjet</a>!</h3><br />May the delivery force be with you!",
          "CustomID": "AppGettingStartedTest"
        }
      ]
    })

    request
      .then((result) => {
        console.log(result.body)
      })
      .catch((err) => {
        console.log(err.statusCode)
      })
  }


  pool.query(checkForUserQuery(email, username), (err, results) => {
    if (err) {
      return next(err);
    }

    const existingUser = results.rowCount > 0;

    if (existingUser) {
      return res.status(422).send({ error: 'Email or username is already in use' });
    }

    const addUserQuery = {
      text: `
      INSERT INTO movers (email, username, password)
        VALUES ($1, $2, $3) RETURNING *;
      `,
      values: [email, username, password],
    };

    pool.query(addUserQuery, (err, results) => {
      if(err) {
        return next(err);
      }

      sendEmail();

      return res.send(results.rows);
    });

    // res.send(results.rows);

  });
};