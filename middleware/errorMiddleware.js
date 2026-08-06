const { validationResult } = require("express-validator");

function handleValidationErrors(callback, validations) {
  return async (req, res, next) => {
    // Passport error handling case (log in)
    if (!validations) {
      return next();
    }

    const route = await callback(req);

    for (const validation of validations) {
      const result = await validation.run(req);

      if (!result.isEmpty()) {
        req.flash("error", result.array());
        return res.status(400).redirect(route);
      }
    }

    next();
  };
}

module.exports = {
  handleValidationErrors,
};
