import subCategoryModel from "../../../DB/model/subCategory.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import { generateSASUrl } from "../../utils/azureServices.js";
export const createSubCateg = asyncHandler(async (req, res, next) => {
  // check the name
  const checkName = await subCategoryModel.findOne({ name: req.body.name });
  if (checkName) {
    return next(new Error("subCategory is already exist"), { cause: 400 });
  }
  // create a subCategory
  await subCategoryModel.create({
    name: req.body.name,
    categoryId: req.params.categoryId,
  });
  // response
  return res.status(201).json({ message: "Done" });
});

export const getSubCateg = asyncHandler(async (req, res, next) => {
  const subCategory = await subCategoryModel
    .find({ categoryId: req.params.categoryId }, "name")
    .populate([{ path: "categoryId", select: "name" }]);
  // const subCategoryNames = subCategory.map((subCategory) => subCategory.name);
  // response
  return res.status(201).json({ message: "Done", subCategory });
});
