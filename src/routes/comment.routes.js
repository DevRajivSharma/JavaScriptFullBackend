import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

import {
    getVideoComments,
    addComment,
    updateComment,
    removeComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.route("/getVideoComments/:videoId").get(getVideoComments);

router.route("/addComment/:videoId").post(verifyJwt, addComment);

router.route("/updateComment/:commentId").patch(verifyJwt, updateComment);

router.route("/removeComment/:commentId").delete(verifyJwt, removeComment);

export default router;