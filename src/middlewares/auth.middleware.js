import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req,res,next) =>{

  try{
    const token = req.cookies?.accessToken
      || req.header("Authorization")?.replace("Bearer ", "");

    // console.log('token found',token);

    if (!token) {
      throw new apiError(400, "Unauthorized access");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      throw new apiError(401, "Unauthorized access token");
    }

    const user = User.findById(decoded._id);

    req.user = user;
    next();
  }
  catch (error){
    throw new apiError(401, "Something went wrong");
  }
})

export {verifyJwt}