import { v4 as uuidv4 } from "uuid";
import upload, { deleteBlob } from "../../utils/azureServices.js";
import { getVideoDurationInSeconds } from "get-video-duration";

/**
 * Handles video file uploads, retrieves updated video details, and provides the new Blob Storage name.
 *
 * @param {Object} files - Files attached to the request, containing the video file.
 * @param {string} userId - User ID obtained from the request.
 * @param {string} courseId - ID of the course associated with the video.
 * @param {string} chapterId - ID of the chapter associated with the video.
 * @param {string} curriculumId - ID of the curriculum associated with the video.
 * @param {string} videoEdited - Optional. The old Blob Storage name of the video to be deleted when updating an existing video.
 * @returns {Promise<Object>} - A promise that resolves with an object containing the updated video details, new Blob Storage name, and additional resources.
 */
export const uploadVideo = async (
  files,
  userId,
  courseId,
  chapterId,
  curriculumId,
  videoEdited = undefined,
  generateHLS = false,
  generateVtt = false
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let videoUrl, duration, blobVideoName;

      // Define the directory structure for storing videos and resources
      const curriculumDirectory = `Users\\${userId}\\Courses\\${courseId}\\${chapterId}\\${curriculumId}`;

      // Check if a video file is present in the request
      if (files?.video) {
        // If updating an existing video, delete the old Blob Storage entry
        if (videoEdited) {
          deleteBlob(videoEdited);
        }

        // Get the duration of the uploaded video
        duration = await getVideoDurationInSeconds(files.video[0].path);

        // Extract the file extension from the uploaded video file
        const blobVideoExtension = files.video[0].originalname.split(".").pop();

        // Define the path and name for the video blob in Azure Storage
        blobVideoName = `${curriculumDirectory}\\Video\\${
          files.video[0].originalname
        }_${uuidv4()}.${blobVideoExtension}`;

        // Upload the video to Azure Blob Storage and get the video URL
        videoUrl = await upload(
          files.video[0].path,
          blobVideoName,
          "video",
          blobVideoExtension,
          generateHLS,
          generateVtt
        );
      }
      // Resolve the Promise with the updated video details
      resolve({
        videoUrl: videoUrl,
        duration: duration,
        blobVideoName: blobVideoName,
      });
    } catch (error) {
      // Reject the Promise with an error if any step encounters an issue
      reject(error);
    }
  });
};

/**
 * Handles resource file uploads, retrieves updated resource details, and provides the directory structure and content.
 *
 * @param {Object} files - Files attached to the request, containing resource files.
 * @param {string} userId - User ID obtained from the request.
 * @param {string} courseId - ID of the course associated with the curriculum.
 * @param {string} chapterId - ID of the chapter associated with the curriculum.
 * @param {string} curriculumId - ID of the curriculum associated with the resources.
 * @returns {Promise<Object>} - A promise that resolves with an object containing the updated resources' directory structure and content details.
 */
export const uploadResources = async (
  req,
  files,
  userId,
  courseId,
  chapterId,
  curriculumId
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Define the directory structure for storing resources
      const curriculumDirectory = `Users\\${req.user.userName}_${req.userId}\\Courses\\${courseId}\\${chapterId}\\${curriculumId}`;

      let resources;

      // Check if additional resource files are attached to the request
      if (files?.resources) {
        resources = [];

        // Upload each resource file to Azure Blob Storage and collect their URLs
        for (const file of files.resources) {
          // Extract the file extension from the resource file
          const blobResourceExtension = file.originalname.split(".").pop();

          // Define the path and name for the resource blob in Azure Storage
          const blobFileName = `${curriculumDirectory}\\Resources\\${
            file.originalname
          }_${uuidv4()}.${blobResourceExtension}`;

          // Upload the resource to Azure Blob Storage and get its URL
          const resourceUrl = await upload(
            file.path,
            blobFileName,
            "_",
            blobResourceExtension,
            false
          );

          // Add resource information to the resources array
          resources.push({
            title: file.originalname,
            blobName: blobFileName,
            type: file.mimetype,
            size: file.size,
          });
        }
      }

      // // Resolve the Promise with the updated resource details
      // resolve({
      //   directory: `${curriculumDirectory}\\Resources`,
      //   content: resources,
      // });
      resolve(resources);
    } catch (error) {
      // Reject the Promise with an error if any step encounters an issue
      reject(error);
    }
  });
};

/**
 * Handles subtitle file uploads, retrieves updated subtitle details, and provides the new Blob Storage name.
 *
 * @param {Object} files - Files attached to the request, containing the subtitle file.
 * @param {string} userId - User ID obtained from the request.
 * @param {string} courseId - ID of the course associated with the curriculum.
 * @param {string} chapterId - ID of the chapter associated with the curriculum.
 * @param {string} curriculumId - ID of the curriculum associated with the subtitles.
 * @param {string} subtitleEdited - Optional. The old Blob Storage name of the subtitles to be deleted when updating existing subtitles.
 * @returns {Promise<Object>} - A promise that resolves with an object containing the updated subtitle details, including the new Blob Storage name.
 */
export const uploadSubtitles = async (
  req,
  files,
  userId,
  courseId,
  chapterId,
  curriculumId,
  subtitleEdited = undefined
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let blobSubtitlesName, subtitlesUrl;

      // Define the directory structure for storing subtitles
      const curriculumDirectory = `Users\\${req.user.userName}_${req.userId}\\Courses\\${courseId}\\${chapterId}\\${curriculumId}`;

      // Check if a subtitle file is present in the request
      if (files?.subtitles) {
        // If updating existing subtitles, delete the old Blob Storage entry
        if (subtitleEdited) {
          deleteBlob(subtitleEdited);
        }

        // Extract the file extension from the uploaded subtitle file
        const blobSubtitlesExtension = files.subtitles[0].originalname
          .split(".")
          .pop();

        // Define the path and name for the subtitle blob in Azure Storage
        blobSubtitlesName = `${curriculumDirectory}\\Subtitles\\${
          files.subtitles[0].originalname
        }_${uuidv4()}.${blobSubtitlesExtension}`;

        // Upload the subtitle file to Azure Blob Storage and get its URL
        subtitlesUrl = await upload(
          files.subtitles[0].path,
          blobSubtitlesName,
          "_",
          blobSubtitlesExtension,
          false
        );
      }

      // Resolve the Promise with the updated subtitle details
      resolve(blobSubtitlesName);
    } catch (error) {
      // Reject the Promise with an error if any step encounters an issue
      reject(error);
    }
  });
};
