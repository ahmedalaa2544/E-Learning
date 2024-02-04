import categoryModel from "../../../DB/model/category.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import { generateSASUrl } from "../../utils/azureServices.js";
export const createCateg = asyncHandler(async (req, res, next) => {
  // check the name
  const checkName = await categoryModel.findOne({ name: req.body.name });
  if (checkName) {
    return next(new Error("Category is already exist"), { cause: 400 });
  }
  console.log("Category" + req.body.name);
  // create a category
  const category = await categoryModel.create({
    name: req.body.name,
  });
  // response
  return res.status(201).json({ message: "Done", category });
});

export const getCateg = asyncHandler(async (req, res, next) => {
  const category = await categoryModel
    .find({}, "name")
    .populate([{ path: "subCategory", select: "name" }]);
  // const categoryNames = category.map((Category) => Category.name);
  // response
  return res.status(201).json({ message: "Done", category });
});
