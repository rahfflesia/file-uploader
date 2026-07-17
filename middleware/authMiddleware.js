function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    res.status(401).send("<h1>Unauthorized access</h1>");
  }

  next();
}

module.exports = {
  isAuthenticated,
};
