import { v4 as uuidv4 } from "uuid";
import upload, { deleteBlob } from "../../utils/azureServices.js";
import { getVideoDurationInSeconds } from "get-video-duration";
/**
 * Handle video file uploads, retrieve updated video details, and provide the new Blob Storage name.
 *
 * @param {Object} files - Files attached to the request, including video and resources.
 * @param {string} userId - User ID associated with the video upload.
 * @param {string} courseId - ID of the course associated with the video.
 * @param {string} chapterId - ID of the chapter associated with the video.
 * @param {string} videoId - ID of the video being uploaded or updated.
 * @param {string} videoEdited - (Optional) The old Blob Storage name of the video to be deleted if updating an existing video.
 * @returns {Promise<Object>} - A Promise resolving to an object containing the updated video details, new Blob Storage name, and additional resources.
 * @throws {Error} - Throws an error if any step of the video upload process encounters an issue.
 */
const handleUpload = async (
  files,
  userId,
  courseId,
  chapterId,
  videoId,
  videoEdited = undefined
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let videoUrl, duration, blobVideoName;

      // Define the directory structure for storing videos and resources
      const videoDirectory = `Users\\${userId}\\Courses\\${courseId}\\${chapterId}\\${videoId}`;

      // Check if a video file is present in the request
      if (files.video) {
        // If updating an existing video, delete the old Blob Storage entry
        if (videoEdited) {
          deleteBlob(videoEdited);
        }

        // Get the duration of the uploaded video
        duration = await getVideoDurationInSeconds(files.video[0].path);
        // Extract the file extension from the uploaded video file
        const blobVideoExtension = files.video[0].originalname.split(".").pop();

        // Define the path and name for the video blob in Azure Storage
        blobVideoName = `${videoDirectory}\\Video\\${
          files.video[0].originalname
        }_${uuidv4()}.${blobVideoExtension}`;

        // Upload the video to Azure Blob Storage and get the video URL
        videoUrl = await upload(
          files.video[0].path,
          blobVideoName,
          "video",
          blobVideoExtension
        );
      }

      let resources;

      // Check if additional resource files are attached to the video
      if (files.resources) {
        resources = [];

        // Upload each resource file to Azure Blob Storage and collect their URLs
        for (const file of files.resources) {
          const blobResourceExtension = file.originalname.split(".").pop();

          const blobFileName = `${videoDirectory}\\Resources\\${
            file.originalname
          }_${uuidv4()}.${blobResourceExtension}`;

          const resourceUrl = await upload(
            file.path,
            blobFileName,
            "video",
            blobResourceExtension,
            false
          );

          // Add resource information to the resources array
          resources.push({ name: file.originalname, url: resourceUrl });
        }
      }

      // Resolve the Promise with the updated video details
      resolve({
        videoUrl: videoUrl,
        resources: resources,
        duration: duration,
        blobVideoName: blobVideoName,
      });
    } catch (error) {
      // Reject the Promise with an error if any step encounters an issue
      reject(error);
    }
  });
};

// Export the function as the default export for use in other modules
export default handleUpload;
