"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const customEnv = require("custom-env");
const db = require("mongodb");
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;

const app = express();

mongo.connect(process.env.DATABASE, (err, db) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');

    //serialization and app.listen
  }
});

app.set("view engine", "pug");
app.use(passport.initialize())
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

passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser((id, done) => {
//  db.collection('users').findOne(
//    {_id: new ObjectID(id)},
//      (err, doc) => {
//        done(null, doc);
//      }
//  );
  done(null, null);
});


app.route("/").get((req, res) => {
  res.render(process.cwd() + "/views/pug/index.pug", {
    title: "Hello",
    message: "Please login"
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
