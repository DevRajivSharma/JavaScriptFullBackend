import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import ApiResponse from "../utils/APiResponse.js";


const registerUser = asyncHandler( async(req,res) =>{
    const {username,fullName, email, password} = req.body;
    if ([username,fullName,email,password].some((val)=> val.trim() === "")){
        throw ApiError(400,"All fields are required");
    }
    const userExist = User.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(userExist){
        throw ApiError(409,"User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.avatar[0]?.path;

    if(!avatarLocalPath){
        throw ApiError(403,"Avatar file needed");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw ApiError(403,"Avatar file needed");
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
        throw ApiError(500,"Something went wrong while creating user");
    }

    return res.status(201).json(
        new ApiResponse(200,"Successfully created user",userCreated)
    )

})

export {registerUser};