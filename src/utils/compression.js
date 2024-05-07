import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
ffmpeg.setFfmpegPath(ffmpegStatic);

// Define a strategy interface
export class compressionStrategy {
  constructor() {}
  /**
   * Method to compress a file. This method should be overridden by subclasses.
   * @throws {Error} This method should be overridden
   */
  compress() {
    throw new Error("This method should be overridden");
  }
}

export class v9Compression extends compressionStrategy {
  /**
   * Constructor for creating a new instance of v9Compression.
   * @param {string} inputFileName - The input file name/path to be compressed.
   * @param {string} outputFileName - The output file name/path where the compressed file will be saved.
   */
  constructor(inputFileName, outputFileName) {
    super();
    this.inputFileName = inputFileName;
    this.outputFileName = outputFileName;
  }

  /**
   * Compresses a video file using the VP9 codec.
   * @returns {Promise<string>} A promise that resolves with the path of the compressed file.
   * @throws {Error} If the compression process encounters an error.
   */
  compress() {
    return new Promise(async (resolve, reject) => {
      // Check if the compression type is "video"
      ffmpeg(this.inputFileName)
        .videoCodec("libvpx-vp9") // Set VP9 codec
        .outputOptions("-deadline best") // Set encoding speed
        .outputOptions("-quality good") // Set encoding quality
        .on("end", () => {
          // Resolve the Promise with the path of the compressed file when the compression is complete
          resolve(this.outputFileName);
        })
        .on("error", (err) => {
          // Reject the Promise with an error if the compression process encounters an error
          reject(err);
        })
        .save(this.outputFileName); // Save the compressed file to the specified output path
    });
  }
}

export class aV1Compression extends compressionStrategy {
  /**
   * Constructor for creating a new instance of aV1Compression.
   * @param {string} inputFileName - The input file name/path to be compressed.
   * @param {string} outputFileName - The output file name/path where the compressed file will be saved.
   */
  constructor(inputFileName, outputFileName) {
    super();
    this.inputFileName = inputFileName;
    this.outputFileName = outputFileName;
  }

  /**
   * Compresses a video file using the AV1 codec.
   * @returns {Promise<string>} A promise that resolves with the path of the compressed file.
   * @throws {Error} If the compression process encounters an error.
   */
  compress() {
    return new Promise(async (resolve, reject) => {
      // Check if the compression type is "video"
      ffmpeg(this.inputFileName)
        .videoCodec("libaom-av1") // Set AV1 codec
        .on("end", () => {
          // Resolve the Promise with the path of the compressed file when the compression is complete
          resolve(this.outputFileName);
        })
        .on("error", (err) => {
          // Reject the Promise with an error if the compression process encounters an error
          reject(err);
        })
        .save(this.outputFileName); // Save the compressed file to the specified output path
    });
  }
}

export class h_264_AACCompression extends compressionStrategy {
  /**
   * Constructor for creating a new instance of h_264_AACCompression.
   * @param {string} inputFileName - The input file name/path to be compressed.
   * @param {string} outputFileName - The output file name/path where the compressed file will be saved.
   */
  constructor(inputFileName, outputFileName) {
    super();
    this.inputFileName = inputFileName;
    this.outputFileName = outputFileName;
  }

  /**
   * Compresses a video file using the H.264 video codec and AAC audio codec.
   * @returns {Promise<string>} A promise that resolves with the path of the compressed file.
   * @throws {Error} If the compression process encounters an error.
   */
  compress() {
    return new Promise(async (resolve, reject) => {
      ffmpeg(this.inputFileName)
        .videoCodec("libx264") // Use H.264 video codec
        .audioCodec("aac") // Use AAC audio codec
        .audioBitrate("128k") // Set audio bitrate to 128 kbps
        .on("end", () => {
          // Resolve the Promise with the path of the compressed file when the compression is complete
          resolve(this.outputFileName);
        })
        .on("error", (err) => {
          // Reject the Promise with an error if the compression process encounters an error
          reject(err);
        })
        .save(this.outputFileName); // Save the compressed file to the specified output path
    });
  }
}

export class imageCompression extends compressionStrategy {
  /**
   * Constructor for creating a new instance of imageCompression.
   * @param {string} inputFileName - The input image file name/path to be compressed.
   * @param {string} outputFileName - The output image file name/path where the compressed image will be saved.
   */
  constructor(inputFileName, outputFileName) {
    super();
    this.inputFileName = inputFileName;
    this.outputFileName = outputFileName;
  }

  /**
   * Compresses an image file.
   * @returns {Promise<string>} A promise that resolves with the path of the compressed image file.
   * @throws {Error} If the compression process encounters an error.
   */
  compress() {
    return new Promise(async (resolve, reject) => {
      const width = 640; // Set the target width for the compressed image
      ffmpeg(this.inputFileName)
        .output(this.outputFileName) // Specify the output path for the compressed image
        .size(`${width}x?`) // Set the width while maintaining the original aspect ratio
        .on("end", () => {
          resolve(this.outputFileName);
        })
        .on("error", (err) => {
          // Reject the Promise with an error if the compression process encounters an error
          reject(err);
        })
        .run(); // Run the FFmpeg command to compress the image
    });
  }
}
