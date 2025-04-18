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
        videoIds: [{
            type: Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        }],
    },
    {
        timestamps: true,
    }
)

export const Playlist = mongoose.model("Playlist", playlistSchema);