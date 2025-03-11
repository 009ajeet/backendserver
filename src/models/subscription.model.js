import dotenv from 'dotenv';
dotenv.config();
import mongoose, { mongo, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const subscriptionSchema = new Schema({
    
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},{
    timestamps:true,
});

export const Subscription = mongoose.model("Subscription",subscriptionSchema); 