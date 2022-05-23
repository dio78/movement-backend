const passport = require('passport');

const { ExtractJwt } = require('passport-jwt')

const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local');
const keys = require('../config/keys');
const { pool } = require('../queries/queries');

const loginQuery = (email) => ({
  text: `
  SELECT *
  FROM movers
  WHERE email =$1`,
  values: [email]
})



const localLogin = new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    pool.query(loginQuery(email), (err, results) => {
      if (err) {
        return done(err);
      }

      const foundUser = results.rows.find((user) => user.password === password);

      if (foundUser) {
        done(null, foundUser);
      } else {
        done(null, false);
      }
    });
  }
);

const jwtQuery = (id) => ({
  text: `
  SELECT *
  FROM movers
  WHERE user_id = $1`,
  values: [id]
})

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: keys.TOKEN_SECRET
}

const jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
  pool.query(jwtQuery(payload.sub), (err, user) => {
    if (err) { return done(err, false) }

    if (user.rowCount === 1) {
      done(null, user)
    } else {
      done(null, false)
    }
  });
});


passport.use(jwtLogin);
passport.use(localLogin);
