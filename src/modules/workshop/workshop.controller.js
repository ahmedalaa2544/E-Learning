import { asyncHandler } from "../../utils/asyncHandling.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import categoryModel from "../../../DB/model/category.model.js";
import subCategoryModel from "../../../DB/model/subCategory.model.js";
import upload, { deleteBlob } from "../../utils/azureServices.js";
import roomModel from "../../../DB/model/room.model.js";
import chatModel from "../../../DB/model/chat.model.js";

export const createWorkshop = asyncHandler(async (req, res, next) => {
  // data
  const { title } = req.body;
  const instructor = req.user._id;

  // create workshop
  const workshop = await workshopModel.create({ title, instructor });

  await chatModel.create({
    participants: [instructor],
    name: title,
    messages: [],
    type: "group",
  });

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
    subtitle,
    description,
    requirements,
    tags,
    languages,
    price,
    discount,
    durationInWeek,
    startDay,
    sessionTime,
    level,
    status,
    schedule,
    categoryId,
    subCategoryId,
  } = req.body;

  if (!Object.keys(req.body).length && !Object.keys(req.files).length)
    return next(new Error("Input fields to update!", { cause: 400 }));

  // check workshop existence
  const workshop = await workshopModel.findById(workshopId);
  if (!workshop) return next(new Error("Workshop Not found!", { cause: 404 }));
  let chat = await chatModel.findOne({ name: workshop.title, type: "group" });

  // only logged instructor can access workshop
  if (!workshop.instructor.equals(req.user._id))
    return next(
      new Error("Only logged instructor can deal with workshop!", {
        cause: 401,
      })
    );

  // update title if attached
  if (title) {
    workshop.title = title;
    if (chat) {
      chat.name = title;
    }
  }

  // update subtitle if attached
  if (subtitle) {
    workshop.subtitle = subtitle;
  }

  // update description if attached
  if (description) {
    workshop.description = description;
  }

  // update requirements if attached
  if (requirements) {
    workshop.requirements = requirements;
  }

  // update tags if attached
  if (tags) {
    workshop.tags = tags;
  }

  // update languages if attached
  if (languages) {
    workshop.languages = languages;
  }

  // update price if attached
  if (price) {
    workshop.price = price;
  }

  // update discount if attached
  if (discount) {
    workshop.discount = discount;
  }

  // update durationInWeek if attached
  if (durationInWeek) {
    workshop.durationInWeek = durationInWeek;
  }

  // update startDay if attached
  if (startDay) {
    workshop.startDay = startDay;
  }

  // update sessionTime if attached
  if (sessionTime) {
    workshop.sessionTime = sessionTime;
  }

  // update level if attached
  if (level) {
    workshop.level = level;
  }

  // update schedule if attached
  if (schedule) {
    workshop.schedule = schedule;
  }

  // update status if attached
  if (status) {
    // validation only allow "Draft" & "Pending"
    workshop.status = status;
  }

  // update category if attached
  if (categoryId) {
    const category = await categoryModel.findById(categoryId);
    if (!category)
      return next(new Error("Category not found!", { cause: 404 }));

    workshop.categoryId = categoryId;
  }

  // update subCategory if attached
  if (subCategoryId) {
    const category = await subCategoryModel.findById(subCategoryId);
    if (!category)
      return next(new Error("SubCategory not found!", { cause: 404 }));

    workshop.subCategoryId = subCategoryId;
  }

  // update promotionImage if attached
  if (req.files?.promotionImage) {
    // check if promotionImage uploaded before
    if (workshop.promotionImage) {
      // delete promotionImage from Azure cloud
      await deleteBlob(workshop.promotionImage.blobName);
    }

    // Extract the extension for the promotion image.
    const blobImageExtension = req.files.promotionImage[0].originalname
      .split(".")
      .pop();

    // Define the path for the promotion image in the user's course directory.
    const blobImageName = `Users\\${req.user.userName}_${
      req.user._id
    }\\Workshops\\${
      title ? title : workshop.title
    }_${workshopId}\\promotion_image.${blobImageExtension}`;

    // Upload the promotion image and obtain its URL.
    const promotionImageUrl = await upload(
      req.files.promotionImage[0].path,
      blobImageName,
      "image",
      blobImageExtension
    );

    workshop.promotionImage.blobName = blobImageName;
    workshop.promotionImage.url = promotionImageUrl;
    if (chat) {
      chat.set("pic", promotionImageUrl);
    }
  }

  await chat.save();

  // update promotionVideo if attached
  if (req.files?.promotionVideo) {
    // check if promotionVideo uploaded before
    if (workshop.promotionVideo) {
      // delete promotionVideo from Azure cloud
      await deleteBlob(workshop.promotionVideo.blobName);
    }

    // Extract the extension for the promotion Video.
    const blobVideoExtension = req.files.promotionVideo[0].originalname
      .split(".")
      .pop();

    // Define the path for the promotion Video in the user's course directory.
    const blobVideoName = `Users\\${req.user.userName}_${
      req.user._id
    }\\Workshops\\${
      title ? title : workshop.title
    }_${workshopId}\\promotion_video.${blobVideoExtension}`;

    // Upload the promotion Video and obtain its URL.
    const promotionVideoUrl = await upload(
      req.files.promotionVideo[0].path,
      blobVideoName,
      "video",
      blobVideoExtension
    );

    // save changes in DB
    workshop.promotionVideo.blobName = blobVideoName;
    workshop.promotionVideo.url = promotionVideoUrl;
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

  // check any file attached first
  if (!req.files?.promotionImage && !req.files?.promotionVideo)
    return next(
      new Error("Attach PromotionImage or PromotionVideo to Upload!", {
        cause: 400,
      })
    );

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

  // Upload promotionImage if attached
  if (req.files?.promotionImage) {
    // check if promotionImage uploaded before
    if (workshop.promotionImage) {
      // delete promotionImage from Azure cloud
      await deleteBlob(workshop.promotionImage.blobName);
    }

    // Extract the extension for the promotion image.
    const blobImageExtension = req.files.promotionImage[0].originalname
      .split(".")
      .pop();

    // Define the path for the promotion image in the user's course directory.
    const blobImageName = `Users\\${req.user.userName}_${req.user._id}\\Workshops\\${workshop.title}_${workshopId}\\promotion_image.${blobImageExtension}`;

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
    await workshop.save();
  }

  // Upload promotionVideo if attached
  if (req.files?.promotionVideo) {
    // check if promotionVideo uploaded before
    if (workshop.promotionVideo) {
      // delete promotionVideo from Azure cloud
      await deleteBlob(workshop.promotionVideo.blobName);
    }

    // Extract the extension for the promotion video.
    const blobVideoExtension = req.files.promotionVideo[0].originalname
      .split(".")
      .pop();

    // Define the path for the promotion video in the user's course directory.
    const blobVideoName = `Users\\${req.user.userName}_${req.user._id}\\Workshops\\${workshop.title}_${workshopId}\\promotion_video.${blobVideoExtension}`;

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
  }

  // send response
  return res.status(200).json({
    success: true,
    message: "Attached Files Uploaded Successfully!",
    results: workshop,
  });
});

export const getAllWorkshops = asyncHandler(async (req, res, next) => {
  // data
  const { view, categoryId, search, paginated } = req.query;
  const page = paginated ? req?.query?.page || 1 : 0;
  const limit = paginated ? req?.query?.limit || 10 : 0;

  let workshops;

  if (categoryId) {
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return next(new Error("Category Not found!", { cause: 404 }));
    }
  }

  workshops = await workshopModel
    .find({
      ...(view === "instructor" && { instructor: req.user._id }),
      ...(categoryId && categoryId),
      ...(search && { title: { $regex: search, $options: "i" } }),
    })
    .skip((page - 1) * limit)
    .limit(limit)
    .select("promotionImage title subtitle startDay sessionTime price")
    .populate({ path: "categoryId", select: "name" })
    .populate({ path: "subCategoryId", select: "name" })
    .populate({ path: "instructor", select: "userName profilePic" });

  return res.status(200).json({ success: true, results: workshops });
});

export const getSpecificWorkshop = asyncHandler(async (req, res, next) => {
  // data
  const { workshopId } = req.params;
  const { view } = req.query;

  let workshop;

  if (view === "instructor") {
    workshop = await workshopModel
      .findById(workshopId)
      .populate("coupons")
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subCategoryId", select: "name" });
  }

  // all
  else if (view === "all") {
    workshop = await workshopModel
      .findById(workshopId)
      .select(
        "title description requirements price promotionVideo durationInWeek languages level instructor"
      )
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subCategoryId", select: "name" })
      .populate([
        {
          path: "instructor",
          select:
            "userName profilePic occupation about totalNumberOfStudents totalNumberOfCourses",
        },
      ]);
  }

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

  // delete workshop only if it isn't published
  if (workshop.status === "Published")
    return next(
      new Error("Workshop is published, Deletion not allowed!", { cause: 405 })
    ); // 405 resourse exists but not allowed

  // delete promotionImage from Azure cloud
  await deleteBlob(workshop.promotionImage.blobName);

  // delete promotionVideo from Azure cloud
  await deleteBlob(workshop.promotionVideo.blobName);

  // delete workshop from DB
  await workshopModel.findByIdAndDelete(workshopId);

  // send response
  return res.status(200).json({
    success: true,
    message: "Workshop Deleted Successfully!",
  });
});

export const publishWorkshop = asyncHandler(async (req, res, next) => {
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

  // check if workshop already published
  if (workshop.status === "Published")
    return next(new Error("Workshop Already Published!", { cause: 400 }));

  // check work shop data is complete
  if (
    !workshop.title ||
    !workshop.subtitle ||
    !workshop.description ||
    !workshop.requirements.length ||
    !workshop.tags.length ||
    !workshop.languages.length ||
    !workshop.price ||
    !workshop.durationInWeek ||
    !workshop.startDay ||
    !workshop.sessionTime ||
    !workshop.level ||
    !workshop.schedule.length ||
    !workshop.promotionImage ||
    !workshop.promotionVideo ||
    !workshop.categoryId ||
    !workshop.subCategoryId
  )
    return next(
      new Error("Complete All Workshop Data to Publish!", { cause: 400 })
    );

  // publish workshop
  await workshopModel.findByIdAndUpdate(workshopId, {
    status: "Published",
  });

  // send response
  return res.status(200).json({
    success: true,
    message: "Workshop Published Successfully!",
  });
});

export const getWorkshopRooms = asyncHandler(async (req, res, next) => {
  // data
  const { workshopId } = req.params;

  // check workshop existence
  const workshop = await workshopModel.findById(workshopId);
  if (!workshop) return next(new Error("Workshop Not found!", { cause: 404 }));

  // fetch workshop rooms
  const rooms = await roomModel.find({ _id: { $in: workshop.rooms } });

  return res.status(200).json({
    success: true,
    message: "All Specified Workshop Rooms",
    results: rooms,
  });
});
