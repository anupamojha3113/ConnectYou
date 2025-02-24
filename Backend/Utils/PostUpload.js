import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises'; // Use promise-based fs for better error handling

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});


const FileUpload = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    // Upload the file to Cloudinary
    const res = await cloudinary.uploader.upload(localfilepath, {
      resource_type: 'auto',
    });

    // Delete the file locally after successful upload
    await fs.unlink(localfilepath);
    return res;
  } catch (error) {
    console.error('File Upload Error:', error.message);

    // Attempt to delete the file if it exists
    try {
      await fs.unlink(localfilepath);
    } catch (unlinkError) {
      if (unlinkError.code !== 'ENOENT') {
        console.error('Failed to delete file:', unlinkError.message);
      }
    }

    return null;
  }
};

export { FileUpload };
