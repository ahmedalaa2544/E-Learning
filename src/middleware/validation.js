export const validation = (Schema) => {
  return (req, res, next) => {
    const validationResult = Schema.validate(
      {
        ...req.params,
        ...req.body,
        ...req.query,
      },
      { abortEarly: false }
    );
    if (validationResult.error) {
      return res.json({
        message: "validation err",
        ValidationError: validationResult.error.details,
      });
    }
    return next();
  };
};

import { Types } from "mongoose";

export const isValidObjectId = (value, helper) => {
  return Types.ObjectId.isValid(value)
    ? true
    : helper.message("invalid objectId");
};
