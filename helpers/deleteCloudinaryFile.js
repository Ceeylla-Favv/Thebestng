const cloudinary = require('../utils/cloudinaryConfig').cloudinary;

const deleteCloudinaryFile = async (url, folder) => {
    if (!url) {
        return;
    }

    const publicId = url.split('/').pop().split(".")[0];
    await cloudinary.uploader.destroy(`airRand/${folder}/${publicId}`);
};


module.exports = deleteCloudinaryFile;