const { validationResult } = require("express-validator");

function handleValidationErrors(route) {
  return (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("errors", result.array());
      return res.status(400).redirect(route);
    }

    next();
  };
}

module.exports = {
  handleValidationErrors,
};
