import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req,res)=>{
    // get all details from user
    // validation 
    // check if user is already is exist or not
    // check for images , avatar
    // upload them to cloudinary 
    // create user object- create  entry in db
    // remove password and refresh token field from response 
    // check for usercreation 
    // return response or send error 

    const {username,fullName,email,password}=req.body
    if(
        [username,fullName,email,password].some((field)=>
        field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required ,Please Fill");
    }

    const flag=User.findOne(
        {
            $or:[{username},{email}]
        }
    )
    if(flag){
        throw new ApiError(409,"User is Already exist with email or username");
    }

    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user= await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage.url||"",
        email,
        password,
        username:username.toLowerCase(),

    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser) throw new ApiError(500,"Something went wrong while Registering the user");

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )

})

export {registerUser}