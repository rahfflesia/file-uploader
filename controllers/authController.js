const bcrypt = require("bcrypt");
const User = require("../models/User");
const Folder = require("../models/Folder");
const { convertBytes } = require("../helpers/helpers");

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
  const folders = (await Folder.getAllUserFolders(userId)).map((folder) => {
    let totalSize = folder.files.reduce((total, current) => {
      return total + current.bytes;
    }, 0);
    return {
      folder_id: folder.folder_id,
      folder_name: folder.folder_name,
      last_used: folder.last_used,
      user_id: folder.user_id,
      size: convertBytes(totalSize),
    };
  });
  console.log(folders);
  res
    .status(200)
    .render("dashboard", { folders: folders, errorMessage: undefined });
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
