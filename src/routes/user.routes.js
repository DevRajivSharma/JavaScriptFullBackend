import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  changeUserName,
  getCurrentUser,
  changeUserAvatar,
  changeUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
}

  from "../controllers/user.controller.js";
import  upload from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name:"avatar",
      maxCount:1
    },
    {
      name:"coverImage",
      maxCount:1
    }
  ]),
  registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(
  verifyJwt,
  logoutUser
)

router.route("/refresh-token").get(refreshAccessToken)
router.route("/change-password").post(
  verifyJwt,
  changePassword
)
router.route("/change-username").post(
  verifyJwt,
  changeUserName
)
router.route("/getCurrentUser").post(
  verifyJwt,
  getCurrentUser
)
router.route("/change-avatar").post(
  verifyJwt,
  upload.single("avatar"),
  changeUserAvatar
)

router.route("/change-avatar").post(
  verifyJwt,
  upload.single("coverImage"),
  changeUserCoverImage
)

router.route("/getChannelData:username").get(
  verifyJwt,
  getUserChannelProfile
)

router.route("/getUserWatchHistory").get(
  verifyJwt,
  getUserWatchHistory
)

export default router;