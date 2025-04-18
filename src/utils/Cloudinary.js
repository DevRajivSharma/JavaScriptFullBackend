import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs';
import upload from "../middlewares/multer.middleware.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (filePath) => {
    try{
        if (!fs.existsSync(filePath)) return 'File not found';
        const uploadResult = await cloudinary.uploader
            .upload(
                filePath,
                {
                    resource_type: 'auto',
                }
            )
        // console.log('File successfully uploaded on URL:',uploadResult);
        fs.unlinkSync(filePath);
        return uploadResult;
    }
    catch (error) {
        fs.unlinkSync(filePath);
        console.log(error);
        return null;
    }
}

export default uploadOnCloudinary;

