import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import ApiResponse from "../utils/APiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import redisClient from "../utils/Redis.Config.js";
import sendEmail from "../utils/EmailSend.js";
import OtpEmailTemp from "../../Templates/emailOtp.js"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
    }
    catch (error) {
        throw new ApiError(500, "Unable to generate access token");
    }
}

const registerUser = asyncHandler( async(req,res) =>{


    const {username,fullName, email, password} = req.body;

    if ([username,fullName,email,password].some((val)=> val.trim() === "")){
        throw new ApiError(400,"All fields are required");
    }

    const userExist = await User.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(userExist){
        throw new ApiError(409,"User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = 
                    req.files?.coverImage?req.files.coverImage[0].path : null;

    if(!avatarLocalPath){
        throw new ApiError(403,"Avatar file needed");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(403,"Avatar file needed");
    }

    const user = await User.create({
        userName:username.toLowerCase(),
        fullName,
        email: email.toLowerCase(),
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password,
    })

    const userCreated = await User.findById(user._id).select(
      "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500,"Something went wrong while creating user");
    }

    return res.status(201).json(
        new ApiResponse(200,"Successfully created user",userCreated)
    )

})

const loginUser = asyncHandler( async(req,res) =>{
    const {username_email,password} = req.body;
    console.log("Inside Login");
    console.log(req.body);
    if(!username_email){
        throw new ApiError(403,"Username or Email is required");
    }
    if([username_email,password].some((val)=> val.trim() === "")){
        throw new ApiError(400,"All fields are required");
    }
    // console.log(typeof username_email.trim().toLowerCase());
    const user = await User.findOne({
            userName:(username_email.toLowerCase())
    })

    if(!user){
        throw new ApiError(403,"User does not exist");
    }

    const isVaild = user.isPasswordValid(password);

    if (!isVaild){
        throw new ApiError(403,"Username or password is invalid");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loginUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    console.log('Cookies',req.cookies);

    return res.status(200)
      .cookie("accessToken", accessToken,options)
      .cookie("refreshToken", refreshToken,options)
      .json(
        new ApiResponse(200,"User logged in successfully",{
            user:loginUser,
        }),
      )
})

const logoutUser = asyncHandler( async(req,res) =>{

    await User.findByIdAndUpdate(
      req.user._id,
      {
          $set:{
              refreshToken:undefined,
          }
      },
      { new: true }
    )

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
      .status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(
          new ApiResponse(200,"Successfully logged in successfully")
      )
})

const forgotPassword = asyncHandler( async(req,res) =>{
    const {email} = req.body;
    if(!email){
        throw new ApiError(403,"Email is required");
    }
    const user = await User.findOne({email});   
    if(!user){
        throw new ApiError(403,"User does not exist");
    }
    const resetToken = user.generateResetPasswordToken();
    await user.save({validateBeforeSave:false});
    res.status(200)
     .json(
        new ApiResponse(200,"Successfully sent reset password link",resetToken)
      )
})

const resetPassword = asyncHandler( async(req,res) =>{
    const {resetToken} = req.params;
    const {password} = req.body;
    if(!resetToken){
        throw new ApiError(403,"Reset token is required");
    }
    if(!password){
        throw new ApiError(403,"Password is required");
    }
    const user = await User.findOne({resetToken});
})

const refreshAccessToken = asyncHandler( async(req,res) =>{

    const userRefreshAccessToken = req.cookies?.refreshToken;
    if(!userRefreshAccessToken){
        throw new ApiError(401,"No access token");
    }
    const decoded = jwt.verify(userRefreshAccessToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded._id);
    if(!user){
        throw new ApiError(403, "Invalid access token");
    }
    if(refreshAccessToken !==  user?.refreshToken){
        throw new ApiError(401,"Refresh access token is expired or used");
    }

    const { accessToken,refreshToken } = await generateAccessAndRefreshToken(user._id)

    const options = {
        httpOnly:true,
        secure:true,
    }

    return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookies("refreshToken",refreshToken,options)
      .json(
        new ApiResponse(200,"Refresh token successfully updated",{})
      )

})

const changePassword = asyncHandler( async(req,res) =>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user._id)

    const isValid = await user.isPasswordValid(oldPassword);
    user.password = newPassword;
    await user.save({
        validateBeforeSave:false
    })
    return res.status(200)
      .json(
        new ApiResponse(200,"Successfully changed password",{})
      )
})

const getCurrentUser = asyncHandler( async(req,res) =>{
    console.log('This is req.user output : ',req.user);
    
    return res.status(200)
      .json(
         new ApiResponse(200,"Current user fetcher successfully",req.user)
      )
})

const changeUserName = asyncHandler( async(req,res) =>{
    const {username} = req.body;
    const user = await User.findOne(username).select("-password -refreshToken");
    return res.status(200)
    .json(
      new ApiResponse(200,"Successfully changed user name",user)
    )
})

const changeUserAvatar = asyncHandler( async(req,res) =>{
    const {userAvatar} = req.file?.path;
    if (!userAvatar){
        throw new ApiError(403, "Invalid user avatar");
    }
    const avatar = await uploadOnCloudinary(userAvatar)

    if(!avatar){
        throw new ApiError(403, "Can't find user avatar");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              avatar:avatar.url
          }
      },
      { new: true },
    ).select("-password -refreshToken");

    return res.status(200)
      .json(
        new ApiResponse(200,"Successfully changed user avatar",user)
      )

})

const changeUserCoverImage = asyncHandler( async(req,res) =>{
    const {userImageCover} = req.file?.path;
    if (!userImageCover){
        throw new ApiError(403, "Invalid user avatar");
    }
    const coverImage = await uploadOnCloudinary(userImageCover)

    if(!coverImage){
        throw new ApiError(403, "Can't find user coverImage");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              coverImage:coverImage.url
          }
      },
      { new: true },
    ).select("-password -refreshToken");
    return res.status(200)
      .json(
        new ApiResponse(200,"Successfully changed user coverImage",user)
      )
})



const getUserWatchHistory = asyncHandler( async(req,res) =>{

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Schema.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from:"videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                        }

                    },
                    {
                        $addFields:{
                            owner:"$owner"
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
      .json(
        new ApiResponse(200,"Successfully fetched user watched history",user[0].watchHistory)
      )


})

const sendEmailVerificationOTP = asyncHandler(async (req, res) => {
    
    console.log('This is request userId',req.user._id);

    const user = await User.findById(req.user._id);
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store OTP with 10 minutes expiry in redis

    await redisClient.set('emailOtp:'+ user.email, otp, "EX", 600, (err, result) => {
        if (err) {
            throw new ApiError(500, "Failed to store OTP in Redis");
        }
    });

    
    // Send email with OTP (you'll need to implement email sending logic)
    console.log('This is receiver email',user.email);
    
    await sendEmail({
        to: user.email,
        subject: "Email Verification OTP",
        text: `Your OTP for email verification is: ${otp}`,
        html: OtpEmailTemp.replace("{verificationCode}", otp),
    })

    return res.status(200)
        .json(
            new ApiResponse(200, "OTP sent successfully")
        );
});

const verifyEmail = asyncHandler(async (req, res) => {

    const {otp} = req.body;
    console.log('This is otp',req.body);
    const user = await User.findById(req.user._id);

    // Check if OTP is valid
    const storedOtp = await redisClient.get('emailOtp:'+ user.email);
    console.log('This is stored otp',storedOtp);
    console.log('This is otp',otp);
    if (otp != storedOtp) {
        throw new ApiError(400, "Invalid OTP");
    }
    // Mark email as verified
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(
            new ApiResponse(200, "Email verified successfully")
        );
});


export {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    refreshAccessToken,
    changePassword,
    changeUserName,
    getCurrentUser,
    changeUserAvatar,
    changeUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory,
    sendEmailVerificationOTP,
    verifyEmail,
};