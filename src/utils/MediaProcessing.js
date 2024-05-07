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
import speech from "@google-cloud/speech";
import { v4 as uuidv4 } from "uuid";

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
    console.log(`tempDirPath : ${tempDirPath}`);

    const outputManifestPath = `${tempDirPath}\\manifest.m3u8`;
    const outputSegmentPath = `${tempDirPath}\\segment%d.ts`;
    let url;
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
        url = accountSasTokenUrl;
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

        resolve(url);
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
    console.log(`tempDirPath : ${tempDirPath}`);
    const directory = blobName + "\\thumbnails";
    const outputThumbnailstPath = `${tempDirPath}\\thumbnails.vtt`;
    const outputThumbnailsSegmentPath = `${tempDirPath}\\thumb%0${padding}d.jpg`;
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
export const generateSRTAndUpload = async (
  blobName,
  tempDirPath,
  inputVideoPath
  // padding
) => {
  return new Promise(async (resolve, reject) => {
    console.log("reach gnerate Srt file");
    const outputAudioPath = `${tempDirPath}\\${uuidv4()}.wav`;
    const srtOutputpath = `${tempDirPath}\\transcription.srt`;
    await extractAudio(inputVideoPath, outputAudioPath);
    const transcription = await transcribeAudio(outputAudioPath);
    console.log("transcription : " + transcription);
    fs.writeFile(srtOutputpath, formatSRT(transcription), async (err, data) => {
      if (err) {
        reject(err);
      }
      // try {
      //   await blockBlobClient.uploadData(data);
      //   // Call next function here if uploadData succeeds
      // } catch (uploadError) {
      //   reject(uploadError);
      // }
    });
    // fs.writeFileSync(srtOutputpath, formatSRT(transcription));
  });
};
export async function extractAudio(inputVideoPath, outputAudioPath) {
  return new Promise(async (resolve, reject) => {
    // Create ffmpeg command to extract audio
    ffmpeg(inputVideoPath)
      .output(outputAudioPath)
      .noVideo() // Exclude video stream
      .audioCodec("pcm_s16le") // Set audio codec to PCM signed 16-bit little-endian
      .audioFrequency(44100) // Set audio sample rate to 44100 Hz
      .audioChannels(2) // Set audio channels to stereo (2 channels)
      .on("end", () => {
        console.log("Audio extraction completed");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error extracting audio:", err);
      })
      .run();
  });
}

async function transcribeAudio(audioFilePath) {
  return new Promise(async (resolve, reject) => {
    console.log("reach transcribeAudio");
    const client = new speech.SpeechClient();
    const audioBytes = fs.readFileSync(audioFilePath);

    const audio = {
      content: audioBytes.toString("base64"),
    };

    const config = {
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "en-US",
    };

    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");

    resolve(transcription);
  });
}
function formatSRT(transcription) {
  const lines = transcription.split("\n");
  let srt = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const startTime = i * 5; // Replace with actual timestamps
    const endTime = (i + 1) * 5; // Replace with actual timestamps

    srt += `${i + 1}\n`;
    srt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
    srt += `${line}\n\n`;
  }

  return srt;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)},${padZero(
    millis,
    3
  )}`;
}

function padZero(num, size = 2) {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
}
