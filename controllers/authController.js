const bcrypt = require("bcrypt");
const User = require("../models/User");
const Folder = require("../models/Folder");
const { convertBytes, isSharedFolder } = require("../helpers/helpers");
const prisma = require("../lib/prisma");

async function getLogin(req, res) {
  res.status(200).render("./auth/login");
}

async function getSignUp(req, res) {
  res.status(200).render("./auth/signup");
}

async function postSignup(req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const signUpData = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.username,
    password_hash: hashedPassword,
  };
  await User.createUser(signUpData);
  res.status(201).redirect("/auth/log-in");
}

async function getDashboard(req, res) {
  const userId = req.session.passport.user;
  const rootData = await Folder.getAllRootElements(userId);
  res.status(200).render("dashboard", {
    elements: rootData.rootElements,
    usedStorage: rootData.formattedStorage,
    folder: null,
    path: "/",
    areDestructiveActionsEnabled: true,
  });
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
