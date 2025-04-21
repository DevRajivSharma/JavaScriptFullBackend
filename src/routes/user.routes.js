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
  verifyEmail
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

router.route("/send-otp").post(
  verifyJwt,
  sendEmailVerificationOTP
)

router.route("/verify-email").post(
  verifyJwt,
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

router.route

export default router;