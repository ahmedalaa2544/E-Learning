import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

const objectId = joi.string().custom(isValidObjectId);

export const createWorkshopSchema = joi
  .object({
    title: joi.string().required(),
  })
  .required();

export const updateWorkshopSchema = joi
  .object({
    workshopId: objectId.required(),
    title: joi.string(),
    description: joi.string(),
    requirements: joi.array().items(joi.string()),
    tags: joi.array().items(joi.string()),
    languages: joi.array().items(joi.string()),
    price: joi.number().min(0),
    discount: joi.number().min(0).max(100),
    durationInWeek: joi.number(),
    level: joi.string().valid("Beginner", "Medium", "Hard"),
    status: joi.string().valid("Draft", "Pending", "Published"),
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

export const getWorkshopSchema = joi
  .object({
    workshopId: objectId.required(),
  })
  .required();

export const deleteWorkshopSchema = joi
  .object({
    workshopId: objectId.required(),
  })
  .required();
