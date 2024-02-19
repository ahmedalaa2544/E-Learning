import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

const objectId = joi.string().custom(isValidObjectId);

export const createRoomSchema = joi
  .object({
    title: joi.string().required(),
    duration: joi.number().min(60).max(600),
    maximumParticipants: joi.number().min(0).max(20),
    workshopId: objectId,
  })
  .required();

export const roomIdSchema = joi
  .object({
    roomId: objectId.required(),
  })
  .required();
