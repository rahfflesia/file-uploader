const { validationResult } = require("express-validator");

function isBadRequest(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).send("<h1>Bad request</h1>");
  }

  next();
}

module.exports = {
  isBadRequest,
};
