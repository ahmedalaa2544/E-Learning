import categoryModel from "../../../DB/model/category.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";

export const createCateg = asyncHandler(async (req, res, next) => {
  // create a category
  const category = await categoryModel.create({
    name: req.body.name,
  });
  // response
  return res.status(201).json({ message: "Done", category });
});

export const getCateg = asyncHandler(async (req, res, next) => {
  const category = await categoryModel.find({}, "name");
  // const categoryNames = category.map((Category) => Category.name);
  // response
  return res.status(201).json({ message: "Done", category });
});
