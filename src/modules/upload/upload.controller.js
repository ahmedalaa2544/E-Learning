import { asyncHandler } from "../../utils/asyncHandling.js";
import { generateSASUrl } from "../../utils/azureServices.js";
import { v4 as uuidv4 } from "uuid";

export const getBlobUrl = asyncHandler(async (req, res, next) => {
  const maxFileSize = 1024 * 1024 * 10; // 10 MB
  const { fileName, fileType } = req.body;
  const containerName = "upload";
  const blobName = `${fileName}_${uuidv4()}.${fileType}`;
  const response = await generateSASUrl(blobName, "racwd", 30, { maxFileSize });
  res.json(response);
});
