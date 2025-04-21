import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/APiResponse.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";
import uploadOnCloudinary  from "../utils/Cloudinary.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    if(!name || !description){
        throw new ApiError(400, "Name and description are required");
    }

    const thumbnailLocalPath = req.file.path;

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required"); 
    }

    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnailCloudinary){
        throw new ApiError(500, "Something went wrong while uploading thumbnail"); 
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        thumbnail: thumbnailCloudinary.url
    })
    if(!playlist){
        throw new ApiError(500, "Something went wrong while creating playlist");
    }
    return res.status(200).json(
        new ApiResponse(200, "Playlist created successfully", playlist) 
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const userId = req.user._id;
    if(!playlistId){
        throw new ApiError(400, "PlaylistId is required");
    } 
    const playlist = await Playlist.findById(playlistId);

    if(playlist.owner.toString()!== userId.toString()){
        throw new ApiError(400, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, "Playlist deleted successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {videoId,position} = req.body;
    if(!playlistId || !videoId){
        throw new ApiError(400, "PlaylistId and videoId are required");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to add video to this playlist");
    }
    const video = await Video.findById(videoId); 
    if(!video){
        throw new ApiError(400, "Video not found");
    }
    playlist.videos.push({videoId, position: position || (playlist.videos?
        playlist.videos.length:0) + 1});
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, "Video added to playlist successfully", playlist)
    )
})

const uploadVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {title,description,position,isPublished} = req.body;

    if(!playlistId){
        throw new ApiError(400, "PlaylistId is required");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }
    if(playlist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to add video to this playlist");
    } 

    
    if(!title ||!description){
        throw new ApiError(400, "Title and description are required");
    }
    const videoLocalPath = req.files?.video[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!videoLocalPath ||!thumbnailLocalPath){
        throw new ApiError(400, "Video and thumbnail are required"); 
    }

    const videoCloudinary = await uploadOnCloudinary(videoLocalPath);
    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.create({
        title,
        description,
        duration: videoCloudinary.duration,
        videoFile: videoCloudinary.url,
        thumbnail: thumbnailCloudinary.url,
        owner: req.user._id,
        isPublished: isPublished || false,
    })

    if(!video){
        throw new ApiError(500, "Something went wrong while creating video"); 
    }

    playlist.videos.push({videoId:video._id, position: position || playlist.videos?
        playlist.videos.length:0 + 1});
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, "Video uploaded successfully", video) 
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {videoId} = req.body;
    if(!playlistId ||!videoId){
        throw new ApiError(400, "PlaylistId and videoId are required");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }
    if(playlist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to remove video from this playlist");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400, "Video not found");
    }
    playlist.videos.pop(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, "Video removed from playlist successfully", playlist)
    )
})

const changePlaylistDetails = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const thumbnailLocalPath = req.file?.path;
    const {name, description} = req.body;

    if(!playlistId){
        throw new ApiError(400, "PlaylistId is required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }
    if(playlist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to change details of this playlist");
    }

    if(thumbnailLocalPath){
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        playlist.thumbnail = thumbnail.url;
        if(!thumbnail){
            throw new ApiError(500, "Something went wrong while uploading thumbnail");
        }
    }

    if(name){
        playlist.name = name;
    }
    if(description){
        playlist.description = description;
    }
    if(thumbnailLocalPath){
        
    }

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, "Playlist details changed successfully", playlist)
    )

})

const getALlVideosFromPlaylist = asyncHandler(async (req, res) => {
   const {playlistId} = req.params;
   if(!playlistId){
    throw new ApiError(400, "PlaylistId is required");
   }
   const playlist = await Playlist.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(playlistId)
        }
    },
    {
        $sort:{
            "videos.position": 1
        }
    },
    {
        $lookup: {
          from: 'videos',
          localField: 'videos.videoId',
          foreignField: '_id',
          as: 'videos',
          pipeline: [
            {
                $match: {
                    isPublished: true 
                }
            },
            {
                $lookup: {
                  from: 'users',
                  localField: 'owner',
                  foreignField: '_id',
                  as: 'owner', 
                  pipeline: [
                    {
                        $addFields: {
                            userName: "$userName",
                            avatar:"$avatar"
                        }
                    } 
                  ]
                },
            } ,
            {
                $addFields:{
                    videoId: "$_id", 
                    videoTitle: "$title",
                    videoThumbnail:"$thumbnail",
                    duration: "$duration",
                    views: "$views",
                    videoFile: "$videoFile",
                }
            }
          ]
        }
    },
    {
        $project: {
            name: 1,
            description: 1,
            thumbnail: 1,
            videos: 
                {   
                    videoId: 1,
                    videoTitle: 1,
                    videoThumbnail: 1,
                    owner: {
                        userName: 1,
                        avatar: 1
                    }
                }
        }
    }
   ]);

   if(!playlist){
    throw new ApiError(400, "Playlist not found"); 
   }

   return res.status(200).json(
    new ApiResponse(200, "Playlist details fetched successfully", playlist)
   )
})

const getAllUserPlaylist = asyncHandler(async (req, res) => {
   const userId = req.user._id;
   const playlists = await Playlist.aggregate([
    {
        $match: {
            owner: new mongoose.Types.ObjectId(userId)
        }
    }, 
    {
        $addFields:{
          totalVideos:{
            $size: "$videos"
          } 
        }
    },
    {
        $sort:{
            createdAt: -1
        }
    },
    {
        $project:{
            _id: 1,
            name: 1,
            description: 1,
            thumbnail: 1,
            totalVideos: 1,
            createdAt: 1,
            updatedAt: 1
        }
    }
   ])
   if(!playlists){
    throw new ApiError(400, "Playlists not found");
   }
   return res.status(200).json(
    new ApiResponse(200, "Playlists fetched successfully", playlists)
   )
})

const getPlaylistById = asyncHandler(async (req, res) => {
   const {playlistId} = req.params;
   if(!playlistId){
    throw new ApiError(400, "PlaylistId is required");
   }

   const playlist = await Playlist.aggregate([
    {
        $match: {
            _id: new mongoose.Types.ObjectId(playlistId)
        }
    },
    {
        $lookup: {
          from: 'videos',
          localField: 'videos.videoId',
          foreignField: '_id',
          as: 'videos',
          pipeline: [
            {
                $match: {
                    isPublished: true 
                }
            },
            {
                $lookup: {
                  from: 'users',
                  localField: 'owner',
                  foreignField: '_id',
                  as: 'owner', 
                  pipeline: [
                    {
                        $addFields: {
                            userName: "$userName",
                            avatar:"$avatar"
                        }
                    } 
                  ]
                },
            } ,
            {
                $addFields:{
                    videoId: "$_id", 
                    videoTitle: "$title",
                    videoThumbnail:"$thumbnail",
                    duration: "$duration",
                    views: "$views",
                    videoFile: "$videoFile",
                }
            }
          ]
        }
    },
    {
        $project: {
            name: 1,
            description: 1,
            thumbnail: 1,
            videos: 
                {   
                    videoId: 1,
                    videoTitle: 1,
                    videoThumbnail: 1,
                    owner: {
                        userName: 1,
                        avatar: 1
                    }
                }
        }
    }
   ]);

   if(!playlist){
    throw new ApiError(400, "Playlist not found"); 
   }

   return res.status(200).json(
    new ApiResponse(200, "Playlist details fetched successfully", playlist)
   )
})

export {
    createPlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    uploadVideoToPlaylist,
    removeVideoFromPlaylist,
    changePlaylistDetails,
    getALlVideosFromPlaylist,
    getAllUserPlaylist,
    getPlaylistById
}