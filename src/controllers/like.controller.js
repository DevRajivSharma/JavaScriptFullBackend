import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/APiResponse.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {   
    const {videoId} = req.params;
    const userId = req.user._id;

    if (!videoId ) {
        throw new ApiError(400, "videoId or userId is required");
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "video not found");
    }

    const existingLike = await Like.findOne({video: videoId, likedBy: userId});

    if (existingLike) {
        await Like.deleteOne({_id: existingLike._id});
        return res.status(200).json(
            new ApiResponse(200,"Video disliked successfully",{})
        )
    }

    const like = await Like.create({video: videoId, likedBy: userId});

    if (!like) {
        throw new ApiError(500, "Something went wrong while liking the video");
    }

    return res.status(200).json(
        new ApiResponse(200,"Video liked successfully",{})
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const userId = req.user._id; 

    if (!commentId || !userId) {
        throw new ApiError(400, "commentId or userId is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(400, "comment not found");
    }

    const existingLike = await Like.findOne({comment: commentId, likedBy: userId});

    if (existingLike) {
        await Like.deleteOne({_id: existingLike._id});
        return res.status(200).json(
            new ApiResponse(200,"Comment disliked successfully",{})
        )
    }

    const like = await Like.create({comment: commentId, likedBy: userId});

    if (!like) {
        throw new ApiError(500, "Something went wrong while liking the comment");
    }

    return res.status(200).json(
        new ApiResponse(200,"Comment liked successfully",{})
    )
})

const allLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true } // Only get video likes, not comment likes
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $lookup: {
                from: "users",
                localField: "videoDetails.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $project: {
                _id: 0,
                video: {
                    _id: "$videoDetails._id",
                    title: "$videoDetails.title",
                    description: "$videoDetails.description",
                    thumbnail: "$videoDetails.thumbnail",
                    duration: "$videoDetails.duration",
                    views: "$videoDetails.views",
                    videoFile: "$videoDetails.videoFile",
                    createdAt: "$videoDetails.createdAt",
                    owner: {
                        _id: "$ownerDetails._id",
                        username: "$ownerDetails.username",
                        avatar: "$ownerDetails.avatar"
                    }
                }
            }
        }
    ]);

    if (!likedVideos?.length) {
        throw new ApiError(404, "No liked videos found");
    }

    return res.status(200).json(
        new ApiResponse(
            200, 
            "Liked videos fetched successfully",
            likedVideos
        )
    );
});

const isVideoLiked = asyncHandler(async (req, res) => {
   const {videoId} = req.params;
   const userId = req.user._id;

   if (!videoId) {
    throw new ApiError(400, "videoId or userId is required");
   }

   const video = await Video.findById(videoId);
   if (!video) {
    throw new ApiError(400, "video not found"); 
   }

   const isLiked = await Like.findOne({video: videoId, likedBy: userId});

   if (!isLiked) {
    return res.status(200).json(
        new ApiResponse(200, "Video not liked", {isLiked: false})
    )
   }
   return res.status(200).json(
    new ApiResponse(200, "Video liked", {isLiked: true})
  );
})

const isCommentLiked = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const userId = req.user._id;

    if (!commentId) {
        throw new ApiError(400, "commentId or userId is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(400, "comment not found");
    } 
    const isLiked = await Like.findOne({comment: commentId, likedBy: userId});

    if (!isLiked) {
        return res.status(200).json(
            new ApiResponse(200, "Comment not liked", {isLiked: false})
        )
    }
    return res.status(200).json(
        new ApiResponse(200, "Comment liked", {isLiked: true})
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    allLikedVideos,
    isVideoLiked,
    isCommentLiked
};