import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        console.log("Tokens Generated Successfully")

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating and acess token", error)
    }

}

const registerUser = asyncHandler(async (req, res) => {
    // get all details from user
    // validation 
    // check if user is already is exist or not
    // check for images , avatar
    // upload them to cloudinary 
    // create user object- create  entry in db
    // remove password and refresh token field from response 
    // check for usercreation 
    // return response or send error 

    const { username, fullName, email, password } = req.body
    if (
        [username, fullName, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required ,Please Fill");
    }
    console.log(User)
    const flag = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if (flag) {
        throw new ApiError(409, "User is Already exist with email or username");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log(avatarLocalPath)
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log(avatar)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase(),

    })
    console.log(user.coverimage)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) throw new ApiError(500, "Something went wrong while Registering the user");
    console.log(createdUser)
    return res.status(200).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body ->data
    // check username or email
    // find the user 
    // check passowrd 
    // access and refresh the token 
    // check cookiew

    const { email, username, password } = req.body
    if (!email && !username) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username: username }, { email: email }]
    });

    if (!user) throw new ApiError(404, "user is not exist")

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) throw new ApiError(403, "password is incorrect")
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true,

    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }, "user logged in SuccessFully")
        )
})


const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
        $set: {
            refreshToken: undefined,
        }
    }, {
        new: true,
    }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logout SuccessFully"))

})



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) throw new ApiError(401, "unauthorized Request dude!")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id);

        if (!user) throw new ApiError(401, "Invalid Refresh Token")

        if (incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Refresh Token Is Expired or Used")

        const options = {
            httpOnly: true,
            secure: true,
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(used._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, { accessToken, newRefreshToken }, "Access Token Refreshed SuccessFully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Message Token")
    }

})

const changeCurrentPassword = asyncHandler (async (req,res)=>{
     const {oldPassword,newPassword} = req.body

     const user = await User.findById(req.user?._id)

     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

     if(!isPasswordCorrect) throw new ApiError(400, "Your Current Password is Wrong")

    user.password= newPassword 
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Your Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{


    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))

} )

const updateAccountDetails = asyncHandler(async(req,res)=>{
     const {fullName,email}= req.body
     
     if(!fullName || !email) throw new ApiError(400,"All fiels are required")
    
     const user = await User.findById(req.user?._id,{
        $set:{
            fullName,
            email:email,

        }
     },{new:true}).select("-password")

     return res
     .status(200)
     .json(new ApiResponse(200,user,"Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
     const avatarLocalPath=req.file?.path
     if(!avatarLocalPath) throw new ApiError(400,"Your Avatar File is Missing")

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url) throw new ApiError(400,"Error While Uploading Avatar")
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Your Avatar File Updated Successfully"))
})


const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverLocalPath=req.file?.path
    if(!coverLocalPath) throw new ApiError(400,"Your Cover File is Missing")

   const coverImage=await uploadOnCloudinary(coverLocalPath)
   if(!coverImage.url) throw new ApiError(400,"Error While Uploading coverImage")
   
   const user = await User.findByIdAndUpdate(
       req.user?._id,
       {
           $set:{
               coverImage:coverImage.url
           }
       },
       {new:true}).select("-password")

       return res
       .status(200)
       .json(new ApiResponse(200,user,"Your Cover File Updated Successfully"))
})


export { registerUser, loginUser, logoutUser, refreshAccessToken ,
    changeCurrentPassword,getCurrentUser,updateUserAvatar,updateUserCoverImage}