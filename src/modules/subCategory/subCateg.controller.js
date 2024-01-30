import subCategoryModel from "../../../DB/model/subCategory.js";
import { asyncHandler } from "../../utils/asyncHandling.js";

export const createSubCateg = asyncHandler(async (req, res, next) => {
  // create a category
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
