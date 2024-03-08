import joi from "joi";

export const signUpSchema = joi
  .object({
    userName: joi.string().min(3).max(20).required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
    cPassword: joi.string().valid(joi.ref("password")).required(),
  })
  .required();

export const activateCodeSchema = joi
  .object({
    activationCode: joi.string().required(),
    email: joi.string(),
  })
  .required();

export const logInSchema = joi
  .object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
  })
  .required();

export const forgetCodeSchema = joi
  .object({
    email: joi.string().email().required(),
  })
  .required();

export const verifyCodeSchema = joi
  .object({
    code: joi.string().length(5).required(),
  })
  .required();

export const changePasswordSchema = joi
  .object({
    password: joi.string().min(8).required(),
    cPassword: joi.string().valid(joi.ref("password")).required(),
  })
  .required();
