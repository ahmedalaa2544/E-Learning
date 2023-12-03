import multer, { diskStorage } from "multer";

export const customValidation = {
  image: ["image/png", "image/jpg", "image/jpeg"],
  file: ["application/pdf", "application/msword", "application/vnd.rar"],
  video: ["video/mp4", "video/x-matroska", "video/x-m4v"],
};
export const fileUpload = (filterArray) => {
  const fileFilter = (req, file, cb) => {
    if (!filterArray.includes(file.mimetype)) {
      return cb(new Error("inVaild Format"), false);
    }
    return cb(null, true);
  };
  return multer({ storage: diskStorage({}), fileFilter });
};
