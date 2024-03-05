import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegStatic);

export const generateHLSManifest = async (
  inputVideoPath,
  outputManifestPath,
  outputSegmentPath
) => {
  await new Promise((resolve, reject) => {
    ffmpeg(inputVideoPath)
      .outputOptions([
        "-c:v h264",
        "-hls_time 10",
        "-hls_list_size 0",
        "-start_number 0",
        "-f hls",
      ])
      .output(outputSegmentPath)
      .on("end", () => {
        const manifestContent = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:10.0,\n${outputSegmentPath}`;
        fs.writeFileSync(outputManifestPath, manifestContent);
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      })
      .run();
  });
};

export default generateHLSManifest;
