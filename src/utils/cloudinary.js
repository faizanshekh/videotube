import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const deleteFromCloudinary = async (fileUrl) => {
    try {
        if (!fileUrl) return null

        const uploadIndex = fileUrl.indexOf("/upload/")

        if (uploadIndex === -1) return null

        let publicId = fileUrl.slice(uploadIndex + "/upload/".length)
        publicId = publicId.replace(/^v\d+\//, "")
        publicId = publicId.substring(0, publicId.lastIndexOf("."))

        return await cloudinary.uploader.destroy(publicId)

    } catch (error) {
        return null
    }
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary, deleteFromCloudinary}