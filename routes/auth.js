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

      if (!user) {
        return done(null, false, { message: "Incorrect user or password" });
      }

      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!isPasswordCorrect) {
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

const signUpValidators = validateSignUp();
auth.post(
  "/sign-up",
  handleValidationErrors("/auth/sign-up", signUpValidators),
  authController.postSignup,
);

const loginValidators = validateLogIn();
auth.post(
  "/log-in",
  handleValidationErrors("/auth/log-in"),
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/auth/log-in",
    failureFlash: true,
  }),
);

auth.get("/log-out", authController.logOut);

module.exports = auth;
