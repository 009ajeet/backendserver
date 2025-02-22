import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const schema = new mongoose.Schema({
    name: String, age: {
        type: Number,
    }
});

const connectDB = async function () {
    try {
        console.log(process.env.MONGODB_URI);
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`Your DataBase is Connect : ${connectionInstance}`);
        const users = connectionInstance.model('users', schema);
        users.insertOne({ name: "rohit", age: 20 })
        const data = await users.find({});
        console.log(data)
    } catch (error) {
        console.log("error is occuring here", error);
        process.exit(1);
    }
}

export default connectDB;