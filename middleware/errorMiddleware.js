const { validationResult } = require("express-validator");

function handleValidationErrors(route, validations) {
  return async (req, res, next) => {
    // Passport error handling case (log in)
    if (!validations) {
      return next();
    }

    for (const validation of validations) {
      const result = await validation.run(req);

      if (!result.isEmpty()) {
        req.flash("error", result.array());

        if (route === "/dashboard" && req.body.parent_folder_id === "") {
          return res.status(400).redirect("/dashboard");
        }

        if (
          route === "/dashboard" &&
          Number.isInteger(parseInt(req.body.parent_folder_id))
        ) {
          return res
            .status(400)
            .redirect(`/folder/files/${req.body.parent_folder_id}`);
        }

        if (route.startsWith("/folder/files")) {
          if (Number.isInteger(req.params.folder_id)) {
            return res
              .status(400)
              .redirect(`/folder/files/${req.params.folder_id}`);
          }
          return res.status(400).redirect("/dashboard");
        }

        return res.status(400).redirect(route);
      }
    }

    next();
  };
}

module.exports = {
  handleValidationErrors,
};
