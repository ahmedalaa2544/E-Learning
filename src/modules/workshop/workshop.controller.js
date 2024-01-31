import { asyncHandler } from "../../utils/asyncHandling.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import categoryModel from "../../../DB/model/category.model.js";
import subCategoryModel from "../../../DB/model/subCategory.model.js";
import slugify from "slugify";
import upload, { deleteBlob } from "../../utils/azureServices.js";

export const createWorkshop = asyncHandler(async (req, res, next) => {
  // data
  const { title } = req.body;
  const instructor = req.user._id;

  // create workshop
  const workshop = await workshopModel.create({ title, instructor });

  // send response
  return res.status(201).json({
    success: true,
    message: "Workshop Created Successfully!",
    results: workshop,
  });
});

export const updateWorkshop = asyncHandler(async (req, res, next) => {
  // data
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
  if (!workshop) return next(new Error("Workshop Not found!", { cause: 404 }));

  // only logged instructor can access workshop
  if (!workshop.instructor.equals(req.user._id))
    return next(
      new Error("Only logged instructor can deal with workshop!", {
        cause: 401,
      })
    );

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

  // save all changes to DB
  await workshop.save();

  // send response
  return res.status(200).json({
    success: true,
    message: "Workshop Updated Successfully",
    results: workshop,
  });
});

export const uploadImageOrVideo = asyncHandler(async (req, res, next) => {
  // data
  const { workshopId } = req.params;

  // check workshop existence
  const workshop = await workshopModel.findById(workshopId);
  if (!workshop) return next(new Error("Workshop Not found!", { cause: 404 }));

  // only logged instructor can access workshop
  if (!workshop.instructor.equals(req.user._id))
    return next(
      new Error("Only logged instructor can deal with workshop!", {
        cause: 401,
      })
    );

  // check files exists
  if (!req.files.promotionImage)
    return next(new Error("Promotion Image not attached!", { cause: 400 }));

  if (!req.files.promotionVideo)
    return next(new Error("Promotion Video not attached!", { cause: 400 }));

  ///////////////////// Upload Promotion Image ///////////////////
  // Extract the extension for the promotion image.
  const blobImageExtension = req.files.promotionImage[0].originalname
    .split(".")
    .pop();

  // Define the path for the promotion image in the user's course directory.
  const blobImageName = `Users\\${req.userId}\\Workshops\\${workshopId}\\promotion_image.${blobImageExtension}`;

  // Upload the promotion image and obtain its URL.
  const promotionImageUrl = await upload(
    req.files.promotionImage[0].path,
    blobImageName,
    "image",
    blobImageExtension
  );

  // save changes in DB
  workshop.promotionImage.blobName = blobImageName;
  workshop.promotionImage.url = promotionImageUrl;

  ///////////////////// Upload Promotion Video ///////////////////
  // Extract the extension for the promotion video.
  const blobVideoExtension = req.files.promotionVideo[0].originalname
    .split(".")
    .pop();

  // Define the path for the promotion video in the user's course directory.
  const blobVideoName = `Users\\${req.userId}\\Workshops\\${workshopId}\\promotion_video.${blobVideoExtension}`;

  // Upload the promotion video and obtain its URL.
  const promotionVideoUrl = await upload(
    req.files.promotionVideo[0].path,
    blobVideoName,
    "video",
    blobVideoExtension
  );

  // save changes in DB
  workshop.promotionVideo.blobName = blobVideoName;
  workshop.promotionVideo.url = promotionVideoUrl;

  await workshop.save();

  // send response
  return res.json({
    success: true,
    message: "Promotion Image & Video Upoaded Successfully!",
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

  // check workshop existence
  const workshop = await workshopModel
    .findById(workshopId)
    .populate({ path: "categoryId", select: "name" })
    .populate({ path: "subCategoryId", select: "name" })
    .populate({ path: "instructor", select: "userName" });

  if (!workshop) return next(new Error("Workshop not found!", { cause: 404 }));

  // send response
  return res.status(200).json({
    success: true,
    message: "Workshop Found Successfully!",
    results: workshop,
  });
});

export const deleteWorkshop = asyncHandler(async (req, res, next) => {
  // data
  const { workshopId } = req.params;

  // check workshop existence
  const workshop = await workshopModel.findById(workshopId);
  if (!workshop) return next(new Error("Workshop Not found!", { cause: 404 }));

  // only logged instructor can access workshop
  if (!workshop.instructor.equals(req.user._id))
    return next(
      new Error("Only logged instructor can deal with workshop!", {
        cause: 401,
      })
    );

  // delete promotionImage & promotionVideo from Azure cloud
  await deleteBlob(workshop.promotionImage.blobName);

  await deleteBlob(workshop.promotionVideo.blobName);

  // delete workshop from DB
  await workshopModel.findByIdAndDelete(workshopId);

  // send response
  return res.status(204).json({
    success: true,
    message: "Workshop Deleted Successfully!",
  });
});
