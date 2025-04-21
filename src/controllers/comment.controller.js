import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/APiResponse.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!videoId) {
        throw new ApiError(400, "videoId is required"); 
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "video not found");
    }

    const comments = await Comment.aggregate([
        {
            $match:{
                videoId: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"userId",
                foreignField:"_id",
                as:"user",
                pipeline:[
                    {
                        $addFields:{
                            "userName": "$userName",
                            "avatar": "$avatar",
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },
        {
            $project:{
                _id:0,
                content:1,
                user:{
                    userName:1,
                    avatar:1,
                },
                totalLikes:{
                    $size:"$likes",
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in:[req.user._id, "$likes.likedBy"]
                        },
                        then:true,
                        else:false,
                    }
                },
            }
        }
    ])

    if (comments.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, "No comments found for this video", {})
        ) 
    }
    return res.status(200).json(
        new ApiResponse(200, "Comments fetched successfully",comments) 
    )

})

const addComment = asyncHandler(async (req, res) => { 
    const {videoId} = req.params;
    const {comment} = req.body;
    const userId = req.user?._id;

    if (!comment || !videoId ) {
        throw new ApiError(400, "comment and videoId both is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "video not found"); 
    }
    const newComment = await Comment.create({
        content: comment,
        videoId,
        userId, 
    })

    if (!newComment) {
        throw new ApiError(500, "Something went wrong while adding comment");
    }

    return res.status(200).json(
        new ApiResponse(200, "Comment added successfully",newComment)
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {comment} = req.body;
    const userId = req.user?._id;
    
    if (!commentId) {
        throw new ApiError(400, "commentId is required"); 
    }

    const commentExist = await Comment.findById(commentId);
    if (!commentExist) {
        throw new ApiError(400, "comment not found");
    }

    if (commentExist.userId.toString()!== userId.toString()) {
        throw new ApiError(400, "You are not authorized to edit this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        content: comment || commentExist.content,
    }, {new: true})

    if (!updatedComment) {
        throw new ApiError(500, "Something went wrong while updating comment");  
    }
    return res.status(200).json(
        new ApiResponse(200, "Comment updated successfully",updatedComment) 
    )
})

const removeComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const userId = req.user?._id;

    if (!commentId ) {
        throw new ApiError(400, "commentId is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(400, "comment not found");
    }

    if (comment.userId.toString() !== userId.toString()) {
        throw new ApiError(400, "You are not authorized to delete this comment");
    } 

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, "Comment deleted successfully")
    )
})



export {
    getVideoComments,
    addComment,
    updateComment,
    removeComment,
}