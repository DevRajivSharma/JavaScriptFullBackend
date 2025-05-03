import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const verifyJwt = asyncHandler(async (req,res,next) =>{

  try{
    const token = req.cookies?.accessToken
      || req.header("Authorization")?.replace("Bearer ", "");
    console.log('cookies is',req.cookies)
    console.log('token found',token);

    if (!token) {
      throw new ApiError(400, "Unauthorized access");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      throw new apiError(401, "Unauthorized access token");
    }

    console.log("These is decoded acess token",decoded);
    
    // const user_id =  new mongoose.Schema.Types.ObjectId(decoded._id);
    console.log("These is user_id",decoded._id);

    const user = await User.findById(decoded._id).select("-password -refreshToken");

    console.log("These is user",user.username);
  
    req.user = user;
    next();
  }
  catch (error){
    console.log(error);
    throw new ApiError(401, "Unauthorized access, Please login again");
  }
})

export {verifyJwt}