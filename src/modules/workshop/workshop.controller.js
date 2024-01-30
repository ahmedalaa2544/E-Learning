import { asyncHandler } from "../../utils/asyncHandling.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import categoryModel from "../../../DB/model/category.model.js";
import subCategoryModel from "../../../DB/model/subCategory.model.js";
import cloudinary from "../../utils/cloud.js";
import slugify from "slugify";

export const createWorkshop = asyncHandler(async (req, res, next) => {
  // data
  const { title } = req.body;
  // const userId = req.user._id

  // if only looged user is instructor he will create workshop

  // create workshop
  const workshop = await workshopModel.create({ title });

  // send response
  return res.status(201).json({
    success: true,
    message: "Workshop Created Successfully!",
    results: workshop,
  });
});

export const updateWorkshop = asyncHandler(async (req, res, next) => {
  // data
  // const userId = req.user._id
  const { workshopId } = req.params;
  const {
    title,
    description,
    requirements,
    tags,
    languages,
    price,
    discount,
    durationInWeek,
    level,
    status,
    schedule,
    categoryId,
    subCategoryId,
  } = req.body;

  if (!Object.keys(req.body).length)
    return next(new Error("Input fields to update!", { cause: 400 }));

  // check workshop existence
  const workshop = await workshopModel.findById(workshopId);
  if (!workshop) return next(new Error("Workshop not found!", { cause: 404 }));

  // check workshop owner(instructor)

  // update title if found
  if (title) {
    workshop.title = title;
    workshop.subtitle = slugify(title);
  }

  // update description if found
  if (description) {
    workshop.description = description;
  }

  // update requirements if found
  if (requirements) {
    workshop.requirements = requirements;
  }

  // update tags if found
  if (tags) {
    workshop.tags = tags;
  }

  // update languages if found
  if (languages) {
    workshop.languages = languages;
  }

  // update price if found
  if (price) {
    workshop.price = price;
  }

  // update discount if found
  if (discount) {
    workshop.discount = discount;
  }

  // update durationInWeek if found
  if (durationInWeek) {
    workshop.durationInWeek = durationInWeek;
  }

  // update level if found
  if (level) {
    workshop.level = level;
  }

  // update status if found
  if (status) {
    workshop.status = status;
  }

  // update schedule if found
  if (schedule) {
    workshop.schedule = schedule;
  }

  // update category if found
  if (categoryId) {
    const category = await categoryModel.findById(categoryId);
    if (!category)
      return next(new Error("Category not found!", { cause: 404 }));

    workshop.categoryId = categoryId;
  }

  // update subCategory if found
  if (subCategoryId) {
    const category = await subCategoryModel.findById(subCategoryId);
    if (!category)
      return next(new Error("SubCategory not found!", { cause: 404 }));

    workshop.subCategoryId = subCategoryId;
  }

  // upload promotionImage if found
  if (req.file) {
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.CLOUD_FOLDER_NAME}/workshop`,
      }
    );

    // update url & id
    workshop.promotionImage.id = public_id;
    workshop.promotionImage.url = secure_url;
  }

  // save all changes to DB
  await workshop.save();

  // send response
  return res.status(200).json({
    success: true,
    message: "Workshop Updated Successfully",
    results: workshop,
  });
});

export const getAllWorkshops = asyncHandler(async (req, res, next) => {
  const workshops = await workshopModel.find();

  return res.status(200).json({ success: true, results: workshops });
});

export const getWorkshop = asyncHandler(async (req, res, next) => {
  // data
  const { workshopId } = req.params;
  // const userId = req.user._id

  // check workshop existence
  const workshop = await workshopModel.findById(workshopId);
  if (!workshop) return next(new Error("Workshop not found!", { cause: 404 }));

  // check workshop owner(instructor)

  // it is found send res
  return res.status(200).json({
    success: true,
    message: "Workshop Found Successfully!",
    results: workshop,
  });
});

export const deleteWorkshop = asyncHandler(async (req, res, next) => {
  // data
  const { workshopId } = req.params;
  // const userId = req.user._id

  // check workshop existence
  const workshop = await workshopModel.findById(workshopId);
  if (!workshop) return next(new Error("Workshop not found!", { cause: 404 }));

  // check workshop owner(instructor)

  // delete promotionImage from cloudinary
  const deletedImage = await cloudinary.uploader.destroy(
    workshop.promotionImage.id
  );

  // delete workshop from DB
  await workshopModel.findByIdAndDelete(workshopId);

  // send response
  return res.status(204).json({
    success: true,
    message: "Workshop Deleted Successfully!",
  });
});
