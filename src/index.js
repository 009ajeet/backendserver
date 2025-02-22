import dotenv from 'dotenv';
dotenv.config();
import connectDB from "./db/index.js";
// import app from "/app.js";
connectDB().then(function () {
    console.log(`Your dtbase is successfully connected`);
    app.listen(`${process.env.PORT}`);
})
