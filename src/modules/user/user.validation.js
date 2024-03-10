import { isValidObjectId } from "../../middleware/validation.js";
import joi from "joi";

export const updateSchema = joi
  .object({
    fullName: joi.string().empty(""),
    firstName: joi.string().empty(""),
    lastName: joi.string().empty(""),
    occupation: joi.string().empty(""),
    school: joi.string().empty(""),
    country: joi.string().empty(""),
    language: joi.string().empty(""),
    about: joi.string().empty(""),
    email: joi.string().email(),
    gitHubLink: joi
      .string()
      .uri({
        scheme: ["http", "https"],
      })
      .regex(/github\.com/),
    linkedinLink: joi
      .string()
      .uri({
        scheme: ["http", "https"],
      })
      .regex(/linkedin\.com/),
    password: joi.string().min(8),
    cPassword: joi.when("password", {
      is: joi.string().min(8).required(),
      then: joi.string().valid(joi.ref("password")).required(),
    }),
    gender: joi.string().valid("male", "female"),
    phone: joi.string().empty(""),
    age: joi.number().integer().positive().min(4).max(100).empty(""),
  })
  .required();

export const wishlistSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
