import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

import {
    createPlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    uploadVideoToPlaylist,
    removeVideoFromPlaylist,
    changePlaylistDetails,
    getALlVideosFromPlaylist,
    getAllUserPlaylist,
    getPlaylistById,
    toggleSavePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/createPlaylist").post(
    verifyJwt,
    upload.single("thumbnail"), 
    createPlaylist
);

router.route("/deletePlaylist/:playlistId").delete(
    verifyJwt,
    deletePlaylist
)

router.route("/addVideoToPlaylist/:playlistId").post(
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

router.route("/removeVideoFromPlaylist/:playlistId/").delete(
    verifyJwt,
    removeVideoFromPlaylist 
)

router.route("/changePlaylistDetails/:playlistId").patch(
  verifyJwt,
  upload.single("thumbnail"),
  changePlaylistDetails 
)

router.route("/getAllVideosFromPlaylist/:playlistId").get(
    verifyJwt,
    getALlVideosFromPlaylist
)

router.route("/getAllUserPlaylist").get(
    verifyJwt,
    getAllUserPlaylist
)

router.route("/getPlaylistById/:playlistId").get(
    verifyJwt,
    getPlaylistById 
)

router.route("/toggleSavePlaylist/:playlistId").patch(
    verifyJwt,
    toggleSavePlaylist
)

export default router;
