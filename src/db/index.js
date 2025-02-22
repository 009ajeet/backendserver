import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async function () {
    try {
        console.log(process.env.MONGODB_URI);
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`Your DataBase is Connect : ${connectionInstance}`);
    } catch (error) {
        console.log("error is occuring here", error);
        process.exit(1);
    }
}

export default connectDB;