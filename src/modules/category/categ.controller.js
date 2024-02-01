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
    .find({})
    .populate([{ path: "subCategory" }]);
  // const categoryNames = category.map((Category) => Category.name);
  // response
  return res.status(201).json({ message: "Done", category });
});

/**
 * Retrieve courses belonging to a specific category and enrich their data with Shared Access Signature (SAS) URLs for cover images and promotional videos.
 *
 * @param {Object} req - Express request object containing the category ID as a parameter.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing a list of enriched courses or an error message.
 */
export const getCategoryCourses = asyncHandler(async (req, res, next) => {
  console.log("reached category");

  // Extract the category ID from the request parameters.
  const { categoryId } = req.params;

  // Retrieve courses associated with the specified category.
  let courses = await Course.find({ category: categoryId });

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
