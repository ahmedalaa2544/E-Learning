import multer, { diskStorage } from "multer";

export const customValidation = {
  image: ["image/png", "image/jpg", "image/jpeg"],
  file: [
    "application/pdf",
    "application/msword",
    "application/vnd.rar",
    "application/zip",
    "application/x-subrip",
  ],
  video: ["video/mp4", "video/x-matroska", "video/x-m4v"],
  voice: ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-ms-wma"],
};
export const fileUpload = (filterArray) => {
  const fileFilter = (req, file, cb) => {
    if (!filterArray.includes(file.mimetype)) {
      return cb(new Error("inVaild Format"), false);
    }
    return cb(null, true);
  };
  const storage = multer.memoryStorage();

  return multer({ storage: diskStorage({}), fileFilter });
};
