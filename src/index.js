import db_connect from "./config/db_connect.js";
import dotenv from "dotenv";
import { app } from "./app.js";
// const express = require("express");
dotenv.config({
  path: "./.env",
});
db_connect()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`example app listening on port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
