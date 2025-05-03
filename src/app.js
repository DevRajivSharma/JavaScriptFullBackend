import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin: [
        'https://rajiv-videotube.netlify.app',
        'http://localhost:5173'
        ],
        credentials: true 
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

export { app }
