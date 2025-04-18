import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    allLikedVideos,
    isVideoLiked,
    isCommentLiked
} from "../controllers/like.controller.js";

const router = Router();

router.post("/togleVideoLike/:videoId", toggleVideoLike);

router.post("/toggleCommentLike/:commentId", toggleCommentLike);

router.get("/allLikedVideos", allLikedVideos);

router.get("/isVideoLiked/:videoId", isVideoLiked);

router.get("/isCommentLiked/:commentId", isCommentLiked);

export default router;