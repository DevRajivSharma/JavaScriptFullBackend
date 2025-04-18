import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    uploadVideo,
    deleteVideo,
    updateVideo,
    getVideoStats,
    searchVideos,
    getVideo,
    getMyVideos,
    updateThumbnail,
    togglePublish
    } 
from "../controllers/video.controller.js";

const router = Router();

router.route("/uploadVieo").post(
    verifyJwt,
    upload.fields([
        {
            name:"video",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    uploadVideo
)

router.route("/updateVideo/:videoId").patch(
    verifyJwt,
    upload.single("video"), 
    updateVideo
)

router.route("/updateThumbnail/:videoId").patch(
   verifyJwt,
   upload.single("thumbnail"),
   updateThumbnail 
)

router.route("/deleteVideo/:videoId").delete(
    verifyJwt,
    deleteVideo
)

router.route("/searchVideos").get(
    verifyJwt,
    searchVideos 
)

router.route("/getVideo/:videoId").get(
    verifyJwt,
    getVideo
)

router.route("/getMyVideos").get(
    verifyJwt,
    getMyVideos 
)

router.route("/getVideoStats/:videoId").get(
    verifyJwt,
    getVideoStats
)

router.route("/togglePublish/:videoId").patch(
    verifyJwt,
    togglePublish 
)

export default router;