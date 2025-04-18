import mongoose, { Schema } from "mongoose";
const likeSchema = new Schema(
    {
        videoId: {
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
        commentId: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export const Like = mongoose.model("Like", likeSchema);