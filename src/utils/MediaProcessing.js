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
import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential,
  BlockBlobClient,
} from "@azure/storage-blob";
import { generateSASUrl } from "./azureServices.js";
import fs from "fs";
import path from "path";

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
export const generateHLSManifestAndUpload = async (
  blobName,
  tempDirPath,
  inputVideoPath,
  sampleRate,
  padding
) => {
  // Step 1: Generate HLS Manifest
  return new Promise(async (resolve, reject) => {
    const directory = blobName + "\\HLS";

    const outputManifestPath = `${tempDirPath}\\manifest.m3u8`;
    const outputSegmentPath = `${tempDirPath}\\segment%d.ts`;
    let manifestURL;
    let segmentCount;
    ffmpeg(inputVideoPath)
      .outputOptions([
        "-c:v h264",
        `-hls_time ${sampleRate}`,
        "-hls_list_size 0",
        "-start_number 0",
        "-f hls",
      ])
      .outputOptions(
        "-hls_segment_filename " + tempDirPath + `/%0${padding}d.ts`
      ) // Set the segment file name pattern
      .output(tempDirPath + "/manifest.m3u8") // Output HLS playlist file
      .on("end", async () => {
        // Count the number of segments written to the output directory
        const files = fs.readdirSync(tempDirPath);
        segmentCount = files.filter((file) => file.endsWith(".ts")).length;
        //uploading
        // Generate a Shared Access Signature (SAS) URL for secure blob access
        const { accountSasTokenUrl, fileUrl } = await generateSASUrl(
          `${directory}\\manifest.m3u8`,
          "racwd",
          100
        );
        console.log(fileUrl);
        manifestURL = accountSasTokenUrl;
        // Create a BlockBlobClient using the SAS URL
        const blockBlobClient = new BlockBlobClient(accountSasTokenUrl);

        // Read the manifest file and upload its data to Azure Blob Storage
        fs.readFile(outputManifestPath, async (err, data) => {
          if (err) {
            reject(err);
          }
          try {
            await blockBlobClient.uploadData(data);
            // Call next function here if uploadData succeeds
          } catch (uploadError) {
            reject(uploadError);
          }
        });
        // Upload video segments
        for (let i = 0; i < segmentCount; i++) {
          // Format the segment number with leading zeros using padStart
          const segmentFileName = `${i.toString().padStart(padding, "0")}.ts`;

          const segmentFilePath = `${tempDirPath}\\${segmentFileName}`;
          console.log(segmentFilePath);
          // Generate a Shared Access Signature (SAS) URL for secure blob access
          const { accountSasTokenUrl, fileUrl } = await generateSASUrl(
            `${directory}\\${segmentFileName}`,
            "racwd",
            100
          );
          // Create a BlockBlobClient using the SAS URL
          const blockBlobClient = new BlockBlobClient(accountSasTokenUrl);
          fs.readFile(
            `${segmentFilePath}`,
            // "utf-8",
            async (err, data) => {
              if (err) {
                reject(err);
              }
              try {
                await blockBlobClient.uploadData(data);

                // Call next function here if uploadData succeeds
              } catch (uploadError) {
                reject(uploadError);
              }
            }
          );
        }
        console.log(segmentCount);

        resolve(manifestURL);
      })
      .on("error", (err) => {
        reject(err);
      })
      .run();
  });
};

export const generateVttAndUpload = async (
  blobName,
  tempDirPath,
  inputVideoPath,
  padding,
  thumbnailInterval
) => {
  return new Promise(async (resolve, reject) => {
    const directory = blobName + "\\thumbnails";
    const outputThumbnailstPath = `${tempDirPath}\\thumbnails.vtt`;
    const outputThumbnailsSegmentPath = `${tempDirPath}/thumb%0${padding}d.jpg`;
    let manifestURL;
    let segmentCount;
    ffmpeg(inputVideoPath)
      .outputOptions([
        "-vf",
        "fps=1/10", // Generates one thumbnail every 10 seconds
        "-s",
        "320x180", // Sets the size of the thumbnail
      ])
      .output(outputThumbnailsSegmentPath)
      .on("end", async () => {
        segmentCount = await createVTTFile(tempDirPath, thumbnailInterval);

        console.log(segmentCount);
        //uploading
        // Generate a Shared Access Signature (SAS) URL for secure blob access
        const { accountSasTokenUrl, fileUrl } = await generateSASUrl(
          `${directory}\\thumbnails.vtt`,
          "racwd",
          100
        );
        var thumbnailsURL = fileUrl;
        const blockBlobClient = new BlockBlobClient(accountSasTokenUrl);

        // Read the manifest file and upload its data to Azure Blob Storage
        fs.readFile(outputThumbnailstPath, async (err, data) => {
          if (err) {
            reject(err);
          }
          try {
            await blockBlobClient.uploadData(data);
            // Call next function here if uploadData succeeds
          } catch (uploadError) {
            reject(uploadError);
          }
        });
        for (let i = 1; i < segmentCount; i++) {
          // Format the segment number with leading zeros using padStart
          const thumbFileName = `thumb${i
            .toString()
            .padStart(padding, "0")}.jpg`;

          const thumbFilePath = `${tempDirPath}\\${thumbFileName}`;
          console.log(thumbFilePath);
          // Generate a Shared Access Signature (SAS) URL for secure blob access
          const { accountSasTokenUrl, fileUrl } = await generateSASUrl(
            `${directory}\\${thumbFileName}`,
            "racwd",
            100
          );
          // Create a BlockBlobClient using the SAS URL
          const blockBlobClient = new BlockBlobClient(accountSasTokenUrl);
          fs.readFile(
            `${thumbFilePath}`,
            // "utf-8",
            async (err, data) => {
              if (err) {
                reject(err);
              }
              try {
                await blockBlobClient.uploadData(data);
                // Call next function here if uploadData succeeds
              } catch (uploadError) {
                reject(uploadError);
              }
            }
          );
        }
        resolve(thumbnailsURL);
      })
      .on("error", (err) => {
        console.error("Error generating thumbnails:", err);
        reject(err);
      })
      .run();

    resolve();
  });
};

export async function createVTTFile(directory, interval) {
  const files = fs
    .readdirSync(directory)
    .filter((file) => file.startsWith("thumb") && file.endsWith(".jpg"));
  let vttContent = "WEBVTT\n\n";
  const segmentCount = files.length;
  files.forEach((file, index) => {
    const startTime = index * interval;
    const endTime = (index + 1) * interval;
    const startTimestamp = new Date(startTime * 1000)
      .toISOString()
      .substr(11, 8);
    const endTimestamp = new Date(endTime * 1000).toISOString().substr(11, 8);

    vttContent += `${startTimestamp} --> ${endTimestamp}\n`;
    vttContent += `${file}#xywh=0,0,320,180\n\n`;
  });

  fs.writeFileSync(path.join(directory, "thumbnails.vtt"), vttContent);
  console.log("VTT file created.");
  return segmentCount;
}
