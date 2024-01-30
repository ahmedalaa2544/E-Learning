import joi from "joi";

export const CategSchema = joi
  .object({
    name: joi.string().required(),
  })
  .required();
