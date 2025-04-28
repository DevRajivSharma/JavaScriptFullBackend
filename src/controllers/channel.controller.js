import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/APiResponse.js";
import {Playlist} from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import mongoose from "mongoose";

const getChannelAllPlaylists = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if (!channelId) {
        throw new ApiError(400, "channelId is required");
    }

    const playlists = await Playlist.find({owner: channelId});

    if (!playlists?.length) {
        throw new ApiError(404, "No playlists found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Playlists fetched successfully",
            playlists
        )
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if (!channelId) {
        throw new ApiError(400, "channelId is required");
    } 
    const videos = await Video.aggregate([
       {
            $match: {
                $and:
                    [
                     {owner: new mongoose.Types.ObjectId(channelId)},
                     {isPublished: true}
                    ]
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
                        $project: {
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        }
    ])

    if (!videos?.length) {
        return res.status(200).json(
            new ApiResponse(
                200,
                "No videos found",
                []
            )
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Videos fetched successfully",
            videos
        )
    );
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    
    if (!channelId) {
        throw new ApiError(403, "Invalid username");
    }

    const channelData = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTO"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriber"
            }
        },
        // Videos data
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            videoFile: 1,
                            description: 1,
                            thumbnail: 1,
                            views: 1,
                            duration: 1,
                            createdAt: 1,
                            isPublished: 1
                        }
                    }
                ]
            }
        },
        // Playlists data
        {
            $lookup: {
                from: "playlists",
                localField: "_id",
                foreignField: "owner",
                as: "playlists",
                pipeline: [
                    {
                        $addFields: {
                            totalContainVideos: {
                                $size: "$videos"
                            }
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            description: 1,
                            thumbnail: 1,
                            createdAt: 1,
                            totalContainVideos:1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                
                totalSubscribers: {
                    $size: "$subscriber"
                },
                totalSubscribedTo: {
                    $size: "$subscribedTO"
                },
                totalVideos: {
                    $size: "$videos"
                },
                totalPlaylists: {
                    $size: "$playlists"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscriber.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                userName: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                isSubscribed: 1,
                totalSubscribers: 1,
                totalSubscribedTo: 1,
                totalVideos: 1,
                totalPlaylists: 1,
                videos: 1,
                playlists: 1
            }
        }
    ]);

    if (!channelData?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                "Channel data fetched successfully",
                channelData[0]
            )
        );
});

export {
    getChannelAllPlaylists,
    getChannelVideos,
    getUserChannelProfile
}