function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    console.log("Acceso no autorizado");
    return res.status(401).redirect("/auth/log-in");
  }

  next();
}

module.exports = {
  isAuthenticated,
};
