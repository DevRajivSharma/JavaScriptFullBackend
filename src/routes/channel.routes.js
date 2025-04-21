import { Router } from 'express';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import {
    getChannelAllPlaylists,
    getChannelVideos,
    getUserChannelProfile
} from '../controllers/channel.controller.js';

const router = Router();

router.route('/getChannelAllPlaylists/:channelId').get(
    verifyJwt,
    getChannelAllPlaylists
)

router.route('/getChannelVideos/:channelId').get(
    verifyJwt,
    getChannelVideos
)

router.route("/getChannelProfile/:channelId").get(
    verifyJwt,
    getUserChannelProfile
  );

export default router;
