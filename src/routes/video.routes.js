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
    getAllVideos,
    togglePublish,
    addViews
    } 
from "../controllers/video.controller.js";

const router = Router();

router.route("/getAllVideos").get(
    verifyJwt,
    getAllVideos 
)

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

router.route("/searchVideos").post(
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

router.route("/addViews/:videoId").patch(
    verifyJwt,
    addViews 
)

export default router;