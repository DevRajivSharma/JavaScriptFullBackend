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
  getUserWatchHistory,
  sendEmailVerificationOTP,
  verifyEmail,
  removeVideoFromWatchHistory,
  clearALlWatchHistory
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

router.route("/sendOtp").post(
  sendEmailVerificationOTP
)

router.route("/verifyOtp").post(
  verifyEmail
)

router.route("/refreshAccessToken").get(refreshAccessToken)

router.route("/changePassword").post(
  verifyJwt,
  changePassword
)

router.route("/changeUserName").post(
  verifyJwt,
  changeUserName
)

router.route("/getCurrentUser").get(
  verifyJwt,
  getCurrentUser
)

router.route("/changeUserAvatar").post(
  verifyJwt,
  upload.single("avatar"),
  changeUserAvatar
)

router.route("/changeUserCoverImage").post(
  verifyJwt,
  upload.single("coverImage"),
  changeUserCoverImage
)

router.route("/getUserWatchHistory").get(
  verifyJwt,
  getUserWatchHistory
)

router.route("/rmVideoWH/:videoId").delete(
  verifyJwt,
  removeVideoFromWatchHistory
)

router.route("/clearAllWH").delete(
  verifyJwt,
  clearALlWatchHistory
)

router.route

export default router;