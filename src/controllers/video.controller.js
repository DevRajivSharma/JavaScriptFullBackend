import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import ApiResponse from "../utils/APiResponse.js";
import mongoose from "mongoose";


const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description , isPublished} = req.body;
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

    if (!videoCloudinary || !thumbnailCloudinary) {
        throw new ApiError(400, "Internal server error")
    }


    const video = await Video.create({
        videoFile: videoCloudinary.url,
        thumbnail: thumbnailCloudinary.url,
        owner: userId,
        title,
        description,
        duration: videoCloudinary.duration,
        isPublished: isPublished || false,
    })

    video.save();
    if (!video) {
        throw new ApiError(400, "Internal server error")
    }

    return res.status(200).json(
        new ApiResponse(200, "Video uploaded successfully", video)
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
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
        new ApiResponse(200, "Video deleted successfully", {})
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
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
        new ApiResponse(200, "Video updated successfully", updatedVideo)
    )
})

const updateThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(400, "You are not authorized to update this video")
    }

    const thumbnailLocalPath = req.file.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "All fields are required")
    }
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);

    const updatedThumbnail = await Video.findByIdAndUpdate(videoId, {
        thumbnail: thumbnailCloudinary.url,
    })

    updatedThumbnail.save();

    return res.status(200).json(
        new ApiResponse(200, "Video updated successfully", updatedThumbnail)
    )
})

const updateVideoTitle = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;
    const { title } = req.body;

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

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        title,
    })

    updatedVideo.save();

    return res.status(200).json(
        new ApiResponse(200, "Video updated successfully", updatedVideo)
    )
})

const updateVideoDescription = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;
    const { description } = req.body;
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
    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        description,
    })

    updatedVideo.save();

    return res.status(200).json(
        new ApiResponse(200, "Video updated successfully", updatedVideo)
    )
})

const getVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    if( video.isPublished === false ){
        throw new ApiError(400, "Video is not published")
    }    
    
    video.views += 1;
    await video.save();

    const user = await User.findById(userId);

    user.watchHistory.addToSet(videoId);
    await user.save();

    const videobyId = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
 
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            }
        },
        {
            $addFields: {
                isLiked: {
                    $cond: {
                        if: { $in: [userId,{$ifNull:["$likes.likedBy",[]]} ] },
                        then: true,
                        else: false
                    }
                },
                totalLikes: { $size: {$ifNull:["$likes",[]]} },
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: {$ifNull:["$subscribers",[]]} },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [userId, {$ifNull:["$subscribers.subscriber",[]]} ] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1,
                        }
                    }
                ]
            }
        }
    ])
    console.log(videobyId);
    res.status(200).json(
        new ApiResponse(200, "Video fetched successfully", videobyId)
    )
})


const getVideoForUpdate = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
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

    const videobyId = await Video.findById(videoId);

    res.status(200).json(
        new ApiResponse(200, "Video fetched successfully", videobyId)
    )
})

const getMyVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        
    ]);

    if (!videos) {
        throw new ApiError(400, "Videos not found")
    }

    res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", videos)
    )
})

const searchVideos = asyncHandler(async (req, res) => {
    const { query, sortBy = "views", page = 1, limit = 10 } = req.body;
    const userId = req.user._id;
    if (!query) {
        throw new ApiError(400, "Search query is required")
    }

    // Handle both single words and sentences
    const searchTerms = query.split(' ').filter(term => term.length > 0);

    const searchPipeline = [
        {
            $match: {
                $and: [
                    { isPublished: true },
                    {
                        $or: [
                            { title: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
                            { description: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
                        ]
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [userId, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1,
                        }
                    }
                ]
            }
        }
    ]

    const searchedVideos = await Video.aggregate(searchPipeline);

    if (!searchedVideos.length) {
        return res.status(200).json(
            new ApiResponse(200, "No videos found", [])
        )
    }

    return res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", {
            videos: searchedVideos,
            currentPage: page,
            totalResults: searchedVideos.length
        })
    )
});

const getVideoStats = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }
    const video = await Video.findById(videoId);

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not the owner of this video")
    }

    const videoStats = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" }
            }
        },
        {
            $project: {
                _id: 1,
                views: 1,
                likesCount: 1,
                isPublished: 1,
            }
        }
    ]);

    if (!videoStats.length) {
        throw new ApiError(404, "Video not found")
    }

    return res.status(200).json(
        new ApiResponse(200, "Video stats fetched successfully", videoStats[0])
    )
});

const togglePublish = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(400, "You are not authorized to update this video")
    }

    const isPublished = video.isPublished;
    video.isPublished =!isPublished;
    await video.save();

    res.status(200).json(
        new ApiResponse(200, "Video updated successfully", video)
    )
})

const getAllVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    let videos ;
    try {
        videos = await Video.aggregate([
            {
                $match: {
                    isPublished: true,
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                }
            },
            {
                $addFields: {
                    isLiked: {
                        $cond: {
                            if: { $in: [userId,{$ifNull:["$likes.likedBy",[]]} ] },
                            then: true,
                            else: false
                        }
                    },
                    totalLikes: { $size: {$ifNull:["$likes",[]]} },
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscribers"
                            }
                        },
                        {
                            $addFields: {
                                subscribersCount: { $size: {$ifNull:["$subscribers",[]]} },
                                isSubscribed: {
                                    $cond: {
                                        if: { $in: [userId, {$ifNull:["$subscribers.subscriber",[]]} ] },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                userName: 1,
                                avatar: 1,
                                subscribersCount: 1,
                                isSubscribed: 1,
                            }
                        }
                    ]
                }
            }
        ])
    }
    catch (error) {
        console.error(error);
    }


    if (!videos) {
        throw new ApiError(400, "Videos not found")
    }

    res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", videos)
    )
})

const addViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id; 

    if (!videoId) {
        throw new ApiError(400, "VideoId is required")
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    if( video.isPublished === false ){
        throw new ApiError(400, "Video is not published")
    }    
    
    video.views += 1;
    await video.save();

    const user = await User.findById(userId);

    user.watchHistory.addToSet(videoId);
    await user.save();

    res.status(200).json(
        new ApiResponse(200, "Views added successfully")
    )

})

const getRelatedVideos = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    const userId = req.user._id;

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    const title = video.title; 
    if (!title) {
        throw new ApiError(400, "Search title is required")
    }

    // Handle both single words and sentences
    const searchTerms = title.split(' ').filter(term => term.length > 0);

    const searchPipeline = [
        {
            $match: {
                $and: [
                    { isPublished: true },
                    { _id: { $ne: new mongoose.Types.ObjectId(videoId) } },
                    {
                        $or: [
                            { title: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
                            { description: { $regex: new RegExp(searchTerms.join('|'), 'i') } },
                        ]
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        }
    ]

    const relatedVideos = await Video.aggregate(searchPipeline);

    if (!relatedVideos.length) {
        return res.status(200).json(
            new ApiResponse(200, "No videos found", [])
        )
    }

    return res.status(200).json(
        new ApiResponse(200, "Videos fetched successfully", relatedVideos)
    )

})

export {
    uploadVideo,
    deleteVideo,
    updateVideo,
    updateThumbnail,
    updateVideoTitle,
    updateVideoDescription,
    searchVideos,
    getVideoStats,
    getVideo,
    getMyVideos,
    getAllVideos,
    togglePublish,
    addViews,
    getRelatedVideos,
    getVideoForUpdate
}