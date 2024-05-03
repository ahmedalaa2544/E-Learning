import Curriculum from "../../DB/model/curriculum.model.js";
import { generateSASUrl } from "../utils/azureServices.js";
export const getResoursces = (curriculumResources) => {
  return new Promise(async (resolve, reject) => {
    const resources = await Promise.all(
      curriculumResources.map(async (resource) => {
        const { accountSasTokenUrl: url } = await generateSASUrl(
          resource.blobName,
          "r",
          "60"
        );

        return {
          title: resource.title,
          type: resource.type,
          size: resource.size,
          url,
        };
      })
    );
    resolve(resources);
  });
};
