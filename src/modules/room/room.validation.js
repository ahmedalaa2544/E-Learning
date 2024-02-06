import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

const objectId = joi.string().custom(isValidObjectId);

export const createRoomSchema = joi
  .object({
    duration: joi.number().min(60).max(600),
    maximumParticipants: joi.number().min(0).max(20),
    workshopId: objectId,
  })
  .required();

export const joinRoomSchema = joi
  .object({
    roomId: objectId.required(),
  })
  .required();

export const getSpecificRoomSchema = joi
  .object({
    roomId: objectId.required(),
  })
  .required();

export const deleteRoomSchema = joi
  .object({
    roomId: objectId.required(),
  })
  .required();
