const bcrypt = require("bcrypt");
const User = require("../models/User");
const Folder = require("../models/Folder");
const { validationResult, matchedData } = require("express-validator");

async function getLogin(req, res) {
  res.status(200).render("./auth/login");
}

async function getSignUp(req, res) {
  res.status(200).render("./auth/signup");
}

async function postSignup(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect("/auth/sign-up");
    }

    const data = matchedData(req);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const signUpData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password_hash: hashedPassword,
    };

    await User.createUser(signUpData);

    res.status(201).redirect("/auth/log-in");
  } catch (err) {
    next(err);
  }
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.session.passport.user;
    const rootData = await Folder.getAllRootElements(userId);
    res.status(200).render("dashboard", {
      elements: rootData.rootElements,
      usedStorage: rootData.formattedStorage,
      folder: null,
      path: "/",
      areDestructiveActionsEnabled: true,
    });
  } catch (err) {
    next(err);
  }
}

function logOut(req, res, next) {
  req.logOut((err) => {
    if (err) {
      next(err);
    }
    res.redirect("/auth/log-in");
  });
}

module.exports = {
  getLogin,
  getSignUp,
  postSignup,
  getDashboard,
  logOut,
};
