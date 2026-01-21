import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            required: true, 
        },
        videos: [
            {
                videoId:{
                type: Schema.Types.ObjectId,
                ref: "Video",
                required: true,
                },
                position: {
                    type: Number, 
                    required: true,
                }
            }
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true, 
        },
        type: {
            type: String,
            enum: ["public", "private"],
            default: "private",
        }
    },
    {
        timestamps: true,
    }
)

export const Playlist = mongoose.model("Playlist", playlistSchema);