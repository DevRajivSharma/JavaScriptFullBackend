import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import upload from "../middlewares/multer.middleware";

import {
    createPlaylist,
    addVideoToPlaylist,
    uploadVideoToPlaylist,
    removeVideoFromPlaylist,
    changePlaylistDetails
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/createPlaylist").post(
    verifyJwt,
    upload.single("thumbnail"), 
    createPlaylist
);

router.route("/addVideoToPlaylist/:playlistId/:videoId").post(
    verifyJwt,
    addVideoToPlaylist 
)

router.route("/uploadVideoToPlaylist/:playlistId").post(
   verifyJwt,
   upload.fields([
    {name:"video", maxCount:1},
    {name:"thumbnail", maxCount:1},
   ]),
   uploadVideoToPlaylist 
)

router.route("/removeVideoFromPlaylist/:playlistId/:videoId").delete(
    verifyJwt,
    removeVideoFromPlaylist 
)

router.route("/changePlaylistDetails/:playlistId").patch(
  verifyJwt,
  upload.single("thumbnail"),
  changePlaylistDetails 
)

export default router;
