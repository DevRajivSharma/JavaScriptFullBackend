import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    allLikedVideos,
    isVideoLiked,
    isCommentLiked,
    getVideoTotalLikes,
    getCommentTotalLikes
} from "../controllers/like.controller.js";

const router = Router();

router.post("/togleVideoLike/:videoId",
    verifyJwt,
    toggleVideoLike);

router.post("/toggleCommentLike/:commentId",
    verifyJwt,
    toggleCommentLike);

router.get("/allLikedVideos",verifyJwt, allLikedVideos);

router.get("/isVideoLiked/:videoId",verifyJwt, isVideoLiked);

router.get("/isCommentLiked/:commentId",verifyJwt, isCommentLiked);

router.get("/getVideoTotalLikes/:videoId",verifyJwt, getVideoTotalLikes); 

router.get("/getCommentTotalLikes/:commentId",verifyJwt, getCommentTotalLikes);

export default router;