import { Router } from "express";
const router = Router();
import * as uploadController from "./upload.controller.js";

router.post("/", uploadController.getBlobUrl);
export default router;
