const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadBufferToCloudinary = (buffer, folder, resourceType) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: `airRand/${folder}`, resource_type: resourceType},
            (error, result) => {
                if (error) {
                    reject(error);
                } else{
                    resolve(result.secure_url);
                }
            }
        );
        stream.end(buffer);
    });
};

module.exports = {cloudinary, uploadBufferToCloudinary};
