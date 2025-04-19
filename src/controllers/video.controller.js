import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import ApiResponse from "../utils/APiResponse.js";
import mongoose from "mongoose";
import redisClient from "../utils/Redis.Config.js";


const uploadVideo = asyncHandler(async (req, res) => {
    const {title, description} = req.body;
    console.log({title, description});
    
    const userId = req.user._id;
    if (!title || !description || !req.files || !req.files.video || !req.files.thumbnail) {
        throw new ApiError(400, "All fields are required")
    }

    const videoLocalPath = req.files.video[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "All fields are required")
    }

    const videoCloudinary = await uploadOnCloudinary(videoLocalPath);
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoCloudinary ||!thumbnailCloudinary) {
        throw new ApiError(400, "Internal server error")
    }
    

    const video = await Video.create({
        videoFile: videoCloudinary.url,
        thumbnail: thumbnailCloudinary.url,
        owner: userId,
        title,
        description,
        duration: videoCloudinary.duration,
    })

    video.save();
    if (!video) {
        throw new ApiError(400, "Internal server error") 
    }

    return res.status(200).json(
        new ApiResponse(200,"Video uploaded successfully",video)
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id; 

    if (!videoId) {
        throw new ApiError(400, "VideoId is required") 
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(400, "You are not authorized to delete this video")
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(
        new ApiResponse(200,"Video deleted successfully",{})
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")  
    } 
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString()!== userId.toString()) {
        throw new ApiError(400, "You are not authorized to update this video")
    }

    const videoLocalPath = req.file.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "All fields are required") 
    }

    const videoCloudinary = await uploadOnCloudinary(videoLocalPath);

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        videoFile: videoCloudinary.url,
        duration: videoCloudinary.duration,
    })
    updatedVideo.save();

    return res.status(200).json(
        new ApiResponse(200,"Video updated successfully",updatedVideo) 
    )
})

const updateThumbnail = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")  
    } 
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString()!== userId.toString()) {
        throw new ApiError(400, "You are not authorized to update this video")
    }

    const thumbnailLocalPath = req.files.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "All fields are required") 
    }
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        videoFile: videoCloudinary.url,
        thumbnail: thumbnailCloudinary.url,
        duration: videoCloudinary.duration,
    })
    updatedVideo.save();

    return res.status(200).json(
        new ApiResponse(200,"Video updated successfully",updatedVideo) 
    )
})

const getVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id;

    if (!videoId) {
       throw new ApiError(400, "VideoId is required") 
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    await User.findByIdAndUpdate(userId, {
        $addToSet: {watchedHistory: videoId},
    })
    res.status(200).json(
        new ApiResponse(200,"Video fetched successfully",video) 
    )
})

const getMyVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const videos = await Video.find({owner: userId});

    if (!videos) {
        throw new ApiError(400, "Videos not found")
    }

    res.status(200).json(
        new ApiResponse(200,"Videos fetched successfully",videos)
    )
})

const searchVideos = asyncHandler(async (req, res) => {

    const {query} = req.body;
    
    if (!query) {
        throw new ApiError(400, "All fields are required")
    }

    const searchedVideos = await Video.find({
        $or:[
            {title: {$regex: query, $options: "i"}},
            {description: {$regex: query, $options: "i"}},
        ]
    });

    if (!searchedVideos) {
        throw new ApiError(400, "Videos not found")
    }

    res.status(200).json(
        new ApiResponse(200,"Videos fetched successfully",searchedVideos)
    )


})

const getVideoStats = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    const views = video.views;

    res.status(200).json(
        new ApiResponse(200,"Video stats fetched successfully",{views})
    )
})

const togglePublish = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString()!== userId.toString()) {
        throw new ApiError(400, "You are not authorized to update this video")
    }

    const isPublished = video.isPublished;

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        isPublished: !isPublished,
    }) 
    res.status(200).json(
        new ApiResponse(200,"Video updated successfully",updatedVideo) 
    )
})


export {
    uploadVideo,
    deleteVideo,
    updateVideo,
    updateThumbnail,
    searchVideos,
    getVideoStats,
    getVideo,
    getMyVideos,
    togglePublish
}