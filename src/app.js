import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ApiError from './utils/ApiError.js';
console.log('This is cors origin ',process.env.CORS_ORIGIN)
const app = express();
console.log(process.env.CORS_ORIGIN);
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}));



app.use(express.json({limit: "16kb"}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"));

app.use(cookieParser());

// Routes import
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import likeRoutes from "./routes/like.routes.js";
import channelRoutes from "./routes/channel.routes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/channels", channelRoutes);


app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        res.status(err.statusCode).json(
            {
                statusCode: err.statusCode,
                message: err.message,
                errors: err.errors,
                data: err.data,
                stack: err.stack
            }
        );
    } else {
        res.status(500).json({
            success: false,
            message: "Internal Server  Error",
            errors: [],
            data: null
        });
    }
});
export { app }
