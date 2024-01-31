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

/**
 * Retrieve courses associated with a specific subcategory within a given category, enriching their data with Shared Access Signature (SAS) URLs for cover images and promotional videos.
 *
 * @param {Object} req - Express request object containing category and subcategory IDs as parameters.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing a list of enriched courses or an error message.
 */
export const getSubCategoryCourses = asyncHandler(async (req, res, next) => {
  // Extract the category and subcategory IDs from the request parameters.
  const { categoryId, subCategoryId } = req.params;

  // Retrieve courses associated with the specified category and subcategory.
  let courses = await Course.find({
    category: categoryId,
    subCategory: subCategoryId,
  });

  // Enrich each course's data with SAS URLs for cover images and promotional videos.
  courses = await Promise.all(
    courses.map(async (course) => {
      // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
      const blobImageName = course.coverImageBlobName;
      const { accountSasTokenUrl: imageUrl } = await generateSASUrl(
        blobImageName,
        "r",
        "60"
      );

      // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
      const blobVideoName = course.promotionalVideoBlobName;
      const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
        blobVideoName,
        "r",
        "60"
      );

      // Return an enriched course object with updated URLs and excluding sensitive blob names.
      return {
        ...course._doc,
        coverImageUrl: imageUrl,
        coverImageBlobName: undefined,
        promotionalVideoUrl: videoUrl,
        promotionalVideoBlobName: undefined,
      };
    })
  );

  // Return a JSON response containing the list of enriched courses or an error message.
  return courses
    ? res.status(200).json({ message: "Done", courses: courses })
    : res.status(500).json({ message: "Something went wrong" });
});
