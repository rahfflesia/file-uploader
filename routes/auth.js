const express = require("express");
const auth = express();
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");
const bcrypt = require("bcrypt");

const {
  validateSignUp,
  validateLogIn,
} = require("../validators/authValidators");
const { handleValidationErrors } = require("../middleware/errorMiddleware");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findUserByEmail(username);

      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!user || !isPasswordCorrect) {
        return done(null, false, { message: "Incorrect user or password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const authController = require("../controllers/authController");

auth.get("/log-in", authController.getLogin);

auth.get("/sign-up", authController.getSignUp);

auth.post(
  "/sign-up",
  [...validateSignUp(), handleValidationErrors("/auth/sign-up")],
  authController.postSignup,
);

auth.post(
  "/log-in",
  [...validateLogIn(), handleValidationErrors("/auth/log-in")],
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/auth/log-in",
    failureMessage: true,
  }),
);

auth.get("/log-out", authController.logOut);

module.exports = auth;
