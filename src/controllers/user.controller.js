import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import ApiResponse from "../utils/APiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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
    const coverImageLocalPath = req.files?.coverImage?req.files.coverImage[0].path : null;

    if(!avatarLocalPath){
        throw new ApiError(403,"Avatar file needed");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(403,"Avatar file needed");
    }

    const user = await User.create({
        username:username.toLowerCase(),
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
    console.log(res);
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
    console.log(typeof username_email.trim().toLowerCase());
    const user = await User.findOne({
            username:(username_email.toLowerCase())
    })

    if(!user){
        throw new ApiError(403,"User does not exist");
    }

    console.log(user);
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

const refreshAccessToken = asyncHandler( async(req,res) =>{

    const userRefreshAccessToken = req.cookies?.refreshToken;
    if(!userRefreshAccessToken){
        throw new ApiError(401,"Refresh access token");
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
    return res.status(200)
      .json(
        new ApiResponse(200,"Current user fetcher successfully",res.user)
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

const getUserChannelProfile = asyncHandler( async(req,res) =>{
    const {username} = req.params;
    if (!username){
        throw new ApiError(403, "Invalid user username");
    }
    const channelData = await User.aggregate([
      {
          $match: {
              username: username
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTO",
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscriber",
          }
      },
      {
          $addFields:{
                totalSubscribers: {
                    $size:"$subscriber"
                },
                totalSubscribedTo: {
                    $size:"subscribedTO"
                },
                isSubscribed: {
                    $cond:{
                        if:{
                            $in:[req.user._id,"$subscriber"]
                        },
                        then:true,
                        else:false
                    }
                }
          }
      },
      {
          $project: {
              username:1,
              fullName:1,
              email:1,
              avatar:1,
              coverImage:1,
              isSubscribed:1,
              totalSubscribers:1,
              totalSubscribedTo:1
          }
      }
    ])

    if(!channelData?.length){
        throw new ApiError(403, "Can't find user channel");
    }

    return res.status(200)
      .json(
        new ApiResponse(200,"Successfully get channel data",channelData)
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

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    changeUserName,
    getCurrentUser,
    changeUserAvatar,
    changeUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
};