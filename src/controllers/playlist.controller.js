import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/APiResponse.js";
import { Video } from "../models/video.model.js";
import { Playlist } from "../models/playlist.model.js";
import uploadOnCloudinary  from "../utils/Cloudinary.js";

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

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
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
    playlist.videos.push(videoId);
    await playlist.save();
})

const uploadVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const {title, description} = req.body;

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
        owner: req.user._id
    })

    if(!video){
        throw new ApiError(500, "Something went wrong while creating video"); 
    }

    playlist.videos.push(video._id);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, "Video uploaded successfully", video) 
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
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
    playlist.videos.pull(videoId);
    await playlist.save();
})

const changePlaylistDetails = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    const thumbnailLocalPath = req.file.path;

    if(!playlistId){
        throw new ApiError(400, "PlaylistId is required");
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }
    if(playlist.owner.toString()!== req.user._id.toString()){
        throw new ApiError(400, "You are not authorized to change details of this playlist");
    }

    const {name, description} = req.body;
    if(!name || !description){
        throw new ApiError(400, "Name and description are required");
    }

    const thumbnail = await cloudinary.uploader.upload(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }
    playlist.name = name;
    playlist.description = description;
    playlist.thumbnail = thumbnail.url;

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, "Playlist details changed successfully", playlist)
    )

})

export {
    createPlaylist,
    addVideoToPlaylist,
    uploadVideoToPlaylist,
    removeVideoFromPlaylist,
    changePlaylistDetails
}