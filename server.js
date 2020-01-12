"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const customEnv = require("custom-env");
// const db = require("mongodb");
const ObjectID = require("mongodb").ObjectID;
const mongo = require("mongodb").MongoClient;
const LocalStrategy = require("passport-local");

const app = express();

app.set("view engine", "pug");
app.use(passport.initialize());
app.use(passport.session());

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
customEnv.env();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);

mongo.connect(process.env.DATABASE, (err, client) => {
  const db = client.db("users");
  if (err) {
    console.log("Database error: " + err);
  } else {
    console.log("Successful database connection");

    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
      db.collection("users").findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
    });

    passport.use(
      new LocalStrategy(function(username, password, done) {
        db.collection("users").findOne({ username: username }, function(
          err,
          user
        ) {
          console.log("User " + username + " attempted to log in.");
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (password !== user.password) {
            return done(null, false);
          }
          return done(null, user);
        });
      })
    );
  }

  app.route("/").get((req, res) => {
    res.render(process.cwd() + "/views/pug/index.pug", {
      title: "Home page",
      message: "Please login",
      showLogin: true,
      showRegistration: true
    });
  });

  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  // Check if user is authenticated on /profile request.
  function ensureAuthenticated(req, res, next) {
//    console.log("Authenticating...");
//    if (req.isAuthenticated()) {
//      console.log("Authenticated !")
//      return next();
//    }
//    console.log("Redirected <<<")
//    res.redirect("/");
    return next()
  }

  // Unauthenticate and logout
  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    console.log(req);
    res.render(process.cwd() + "/views/pug/profile", {
      username: req.body.username
    });
  });

  // Registration
  app.route("/register").post(
    (req, res, next) => {
      db.collection("users").findOne({ username: req.body.username }, function(
        err,
        user
      ) {
        if (err) {
          next(err);
        } else if (user) {
          res.redirect("/");
        } else {
          db.collection("users").insertOne(
            {
              username: req.body.username,
              password: req.body.password
            },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                next(null, user);
              }
            }
          );
        }
      });
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      res.redirect("/profile");
    }
  );

  // Handle 404
  app.use((req, res, next) => {
    res
      .status(404)
      .type("text")
      .send("Not found");
  });

  app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port " + process.env.PORT);
  });
});
