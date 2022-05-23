require('./passport');

const passport = require('passport');

const requireSignin = passport.authenticate('local', { session: false });
const requireAuth = passport.authenticate('jwt', { session: false });


module.exports = {
  requireSignin,
  requireAuth
}