const path = require("node:path");
const express = require("express");
const app = express();
const prisma = require("./lib/prisma");
const passport = require("passport");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const flash = require("connect-flash");

const auth = require("./routes/auth");
const folder = require("./routes/folders");
const file = require("./routes/files");

const User = require("./models/User");

const authController = require("./controllers/authController");

const { isAuthenticated } = require("./middleware/authMiddleware");
const { validateDashboard } = require("./validators/authValidators");

const port = 8080;
const assetsPath = path.join(__dirname, "public");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(assetsPath));
app.use(passport.session());
app.use(flash());

// Add the current user to the response
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// Routes
app.use("/auth", auth);
app.use("/folder", folder);
app.use("/file", file);

app.get("/", (req, res) => {
  if (!req.session.passport?.user) {
    res.status(200).redirect("/auth/log-in");
  }
  res.status(200).redirect("/dashboard");
});

const dashboardValidators = validateDashboard();
app.get("/dashboard", [isAuthenticated, ...dashboardValidators] , authController.getDashboard);

// 404 error middleware handler
app.use((req, res, next) => {
  res.status(404).send("<h1>Not found</h1>");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log("An error has ocurred", err);
});

app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    throw err;
  }
  console.log("Server listening on port", port);
});
