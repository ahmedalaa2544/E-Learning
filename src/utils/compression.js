/**
 * Compresses a file using FFmpeg based on the specified compression type.
 *
 * @param {string} inputFileName - The path to the input file to be compressed.
 * @param {string} outputFileName - The path to save the compressed output file.
 * @param {string} type - The type of compression to apply (e.g., "video" or "image").
 * @returns {Promise<string>} - A Promise resolving to the path of the compressed file.
 * @throws {Error} - Throws an error if the compression process encounters an error or if the compression type is invalid.
 */
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegStatic);

export const compressionFile = (inputFileName, outputFileName, type) => {
  return new Promise(async (resolve, reject) => {
    // Check if the compression type is "video"
    if (type === "video") {
      ffmpeg(inputFileName)
        .videoCodec("libx264") // Use H.264 video codec
        .audioCodec("aac") // Use AAC audio codec
        .audioBitrate("128k") // Set audio bitrate to 128 kbps
        .on("end", () => {
          // Resolve the Promise with the path of the compressed file when the compression is complete
          resolve(outputFileName);
        })
        .on("error", (err) => {
          // Reject the Promise with an error if the compression process encounters an error
          console.error(`Error: ${err}`);
          reject(err);
        })
        .save(outputFileName); // Save the compressed file to the specified output path
    } else if (type === "image") {
      // If the compression type is "image"
      const width = 640; // Set the target width for the compressed image
      ffmpeg(inputFileName)
        .output(outputFileName) // Specify the output path for the compressed image
        .size(`${width}x?`) // Set the width while maintaining the original aspect ratio
        .on("end", () => {
          resolve(outputFileName);
        })
        .on("error", (err) => {
          // Reject the Promise with an error if the compression process encounters an error
          console.error(`Error: ${err}`);
          reject(err);
        })
        .run(); // Run the FFmpeg command to compress the image
    } else {
      // If the compression type is neither "video" nor "image"
      reject(new Error("Invalid compression type"));
    }
  });
};
