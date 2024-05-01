import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

const objectId = joi.string().custom(isValidObjectId);

export const workshopIdSchema = joi
  .object({
    workshopId: objectId.required(),
  })
  .required();

export const getWorkshopRoomsSchema = joi
  .object({
    workshopId: objectId.required(),
  })
  .required();

export const createWorkshopSchema = joi
  .object({
    title: joi.string().required(),
  })
  .required();

export const updateWorkshopSchema = joi
  .object({
    workshopId: objectId.required(),
    title: joi.string(),
    subtitle: joi.string(),
    description: joi.string(),
    requirements: joi.array().items(joi.string()),
    tags: joi.array().items(joi.string()),
    languages: joi.array().items(joi.string()),
    price: joi.number().min(0),
    discount: joi.number().min(0).max(100),
    durationInWeek: joi.number(),
    startDay: joi.string(),
    sessionTime: joi.string(),
    level: joi
      .string()
      .valid("Beginner", "Intermediate", "Expert", "All Levels"),
    status: joi.string().valid("Draft", "Pending"),
    schedule: joi
      .array()
      .items(
        joi
          .string()
          .valid(
            "Saturday",
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday"
          )
      ),
    categoryId: objectId,
    subCategoryId: objectId,
  })
  .required();

export const getAllWorkshopsSchema = joi
  .object({
    view: joi.string().valid("all", "instructor").required(),
    categoryId: objectId.allow(""),
    search: joi.string().allow(""),
    limit: joi.number().integer().min(1).optional().allow(""),
    page: joi.number().integer().min(1).allow(""),
    paginated: joi.boolean().allow(""),
  })
  .required();

export const getSpecificWorkshopSchema = joi
  .object({
    workshopId: objectId.required(),
    view: joi.string().valid("all", "instructor").required(),
  })
  .required();
