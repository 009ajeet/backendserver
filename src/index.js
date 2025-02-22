import dotenv from 'dotenv';
dotenv.config();
import connectDB from "./db/index.js";
import { app } from './app.js';
// import app from "/app.js";
connectDB().then(function () {
    console.log(`Your dtbase is successfully connected`);
    console.log(process.env.PORT);
    app.listen(process.env.PORT);
}).catch(() => {
    console.log("error is coming in listen area")
})
