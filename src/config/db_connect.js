import mongoose from "mongoose";
import { db_name } from "../constants.js";
const db_connect = async () => {
  try {
    await mongoose.connect(`${process.env.mongoDB_URL}/${db_name}`);
    console.log(`mongoDb connected...port number: ${mongoose.connection.host}`);
  } catch {
    console.log(process.env.mongoDB_URL);
    console.log("error: ", error);
    process.exit(1);
  }
};
export default db_connect;
