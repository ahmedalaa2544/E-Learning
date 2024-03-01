import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential,
  BlockBlobClient,
} from "@azure/storage-blob";
import temp from "temp";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { compressionFile } from "./compression.js";

/**
 * Creates a new container in Azure Blob Storage or retrieves an existing one.
 *
 * @param {string} containerName - The name of the container to be created or retrieved.
 * @param {BlobServiceClient} blobServiceClient - The BlobServiceClient instance used for interaction with Azure Blob Storage.
 * @returns {ContainerClient} - The ContainerClient instance representing the specified container.
 * @throws {Error} - Throws an error if the required parameters are not provided or if the container creation fails.
 */
async function createContainer(containerName, blobServiceClient) {
  // Obtain a ContainerClient for the specified container name.
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Attempt to create the container if it does not already exist.
  // This is an asynchronous operation, so we use the 'await' keyword.
  await containerClient.createIfNotExists();

  // Return the ContainerClient instance for the created or existing container.
  return containerClient;
}

/**
 * Creates and returns a BlobServiceClient instance for interacting with Azure Blob Storage.
 *
 * @param {string} serviceName - The name of the Azure Storage account.
 * @param {string} serviceKey - The access key for the Azure Storage account.
 * @returns {BlobServiceClient} - An instance of BlobServiceClient configured with the provided credentials.
 * @throws {Error} - Throws an error if the required parameters are not provided.
 */
async function getBlobServiceClient(serviceName, serviceKey) {
  // Create a StorageSharedKeyCredential using the provided service name and key.
  const sharedKeyCredential = new StorageSharedKeyCredential(
    serviceName,
    serviceKey
  );

  // Create a BlobServiceClient instance using the Storage account URL and shared key credential.
  const blobServiceClient = new BlobServiceClient(
    `https://${serviceName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  // Return the configured BlobServiceClient for further use.
  return blobServiceClient;
}

/**
 * Generates a Shared Access Signature (SAS) URL for a specified blob in Azure Blob Storage.
 *
 * @param {string} blobName - The hierarchy of folders and the blob name in the container.
 * @param {string} permissions - The permissions to assign to the SAS token. Default is "r" (read-only).
 * @param {number} timerange - The duration of the SAS token in minutes. Default is 1 minute.
 * @returns {Object} - An object containing the SAS token URL and the URL of the blob.
 * @throws {Error} - Throws an error if required parameters are missing or if any operation fails.
 */
export const generateSASUrl = async (
  blobName,
  permissions = "r",
  timerange = 1
) => {
  // Specify the container name for temporary uploads
  const containerName = process.env.MAIN_CONTAINER;

  const serviceName = process.env.accountName;
  const serviceKey = process.env.accountKey;

  // Check if required parameters are provided
  if (!serviceName || !serviceKey || !blobName || !containerName) {
    return "Generate SAS function missing parameters";
  }

  // Create BlobServiceClient using provided credentials
  const blobServiceClient = await getBlobServiceClient(serviceName, serviceKey);

  // Create or retrieve the container using the BlobServiceClient
  const containerClient = await createContainer(
    containerName,
    blobServiceClient
  );

  // Get the BlockBlobClient for the specified file in the container
  const blockBlobClient = await containerClient.getBlockBlobClient(blobName);

  // Best practice: create time limits
  const SIXTY_MINUTES = timerange * 60 * 1000;
  const NOW = new Date();

  NOW.setMinutes(NOW.getMinutes() - 5);
  // Generate SAS URL for the blob with specified permissions and time limits
  const accountSasTokenUrl = await blockBlobClient.generateSasUrl({
    // startsOn: NOW,
    expiresOn: new Date(new Date().valueOf() + SIXTY_MINUTES),
    permissions: BlobSASPermissions.parse(permissions),
    protocol: SASProtocol.Https,
  });
  // Return an object containing the SAS token URL and the URL of the blob
  return {
    accountSasTokenUrl: accountSasTokenUrl,
    fileUrl: blockBlobClient.url,
  };
};

/**
 * Uploads a file to Azure Blob Storage after compressing it and generating a Shared Access Signature (SAS) URL.
 *
 * @param {string} inputFilePath - The path to the file to be uploaded.
 * @param {string} blobName - The name to assign to the blob in Azure Blob Storage.
 * @param {string} type - The type of compression to apply to the file.
 * @param {string} fileExtension - The file extension of the uploaded file.
 * @returns {void}
 * @throws {Error} - Throws an error if any step of the upload process fails.
 */
const upload = async (
  inputFilePath,
  blobName,
  type,
  fileExtension,
  compress = true
) => {
  return new Promise((resolve, reject) => {
    // Initialize the temp module for temporary directory management
    temp.track();

    // Create a temporary directory
    temp.mkdir("upload", async (err, tempDirPath) => {
      if (!err) {
        // initialize outputFileName with that value will be used id there is no compress
        let outputFileName = inputFilePath;
        try {
          // if flag compress true compress will happen for certain types
          if (compress) {
            // Generate a temporary file path using a unique identifier and the specified file extension
            const fileTempPath = `${tempDirPath}\\${uuidv4()}.${fileExtension}`;

            // //
            // // Compress the input file and get the output file name
            // outputFileName = await compressionFile(
            //   inputFilePath,
            //   fileTempPath,
            //   type
            // );
          }

          // Specify the container name for temporary uploads
          const containerName = process.env.MAIN_CONTAINER;

          // Generate a Shared Access Signature (SAS) URL for secure blob access
          const { accountSasTokenUrl, fileUrl } = await generateSASUrl(
            blobName,
            "racwd",
            30
          );

          // Create a BlockBlobClient using the SAS URL
          const blockBlobClient = new BlockBlobClient(accountSasTokenUrl);
          // Read the compressed file and upload its data to Azure Blob Storage
          const data = fs.readFileSync(outputFileName);
          await blockBlobClient.uploadData(data);
          setTimeout(async () => {}, 1000);

          // Cleanup: Remove the temporary directory when the upload is complete
          temp.cleanup();

          // Return the fileUrl after successful upload
          resolve(fileUrl);
        } catch (error) {
          // Cleanup in case of an error
          temp.cleanup();
          reject(error);
        }
      } else {
        // Cleanup in case of an error
        temp.cleanup();
        reject(new Error("Error creating temporary directory"));
      }
    });
  });
};

/**
 * Delete a Blob from Azure Blob Storage using the provided Blob name.
 *
 * @param {string} blobName - Name of the Blob to be deleted.
 * @throws {Error} - Throws an error if any step of the Blob deletion process encounters an issue.
 */
export const deleteBlob = async (blobName) => {
  try {
    // Retrieve the main container name from environment variables
    const containerName = process.env.MAIN_CONTAINER;

    // Create a BlobServiceClient using the provided credentials
    const blobServiceClient = await getBlobServiceClient(
      process.env.accountName,
      process.env.accountKey
    );

    // Create or retrieve the container using the BlobServiceClient
    const containerClient = await createContainer(
      containerName,
      blobServiceClient
    );

    // Get a reference to the Blob using the provided Blob name
    const blobClient = await containerClient.getBlockBlobClient(blobName);

    // Delete the Blob from Azure Blob Storage
    await blobClient.delete();
  } catch (error) {
    // Throw an error if any step encounters an issue during Blob deletion
    return new Error(`Error deleting Blob: ${error.message}`);
  }
};

/**
 * Delete a Blob Storage container along with all its blobs.
 *
 * @param {string} containerName - Name of the Blob Storage container to be deleted.
 * @throws {Error} - Throws an error if any step of the container deletion process encounters an issue.
 */
export const deleteContainer = async (containerName) => {
  try {
    // Create a BlobServiceClient using the provided credentials
    const blobServiceClient = await getBlobServiceClient(
      process.env.accountName,
      process.env.accountKey
    );

    // Create or retrieve the container using the BlobServiceClient
    const containerClient = await createContainer(
      containerName,
      blobServiceClient
    );

    // Delete the container along with all its blobs
    await containerClient.delete();

    // Log success message after successful container deletion
    console.log(`Container "${containerName}" deleted successfully.`);
  } catch (error) {
    // Throw an error if any step encounters an issue during container deletion
    throw new Error(
      `Error deleting container "${containerName}": ${error.message}`
    );
  }
};

/**
 * Delete all blobs within a specified directory path in a Blob Storage container.
 *
 * @param {string} directoryPath - Path of the directory within the Blob Storage container to be deleted.
 * @throws {Error} - Throws an error if any step of the directory deletion process encounters an issue.
 */
export const deleteDirectory = async (directoryPath) => {
  try {
    // Retrieve the main container name from environment variables
    const containerName = process.env.MAIN_CONTAINER;

    // Create a BlobServiceClient using the provided credentials
    const blobServiceClient = await getBlobServiceClient(
      process.env.accountName,
      process.env.accountKey
    );

    // Create or retrieve the container using the BlobServiceClient
    const containerClient = await createContainer(
      containerName,
      blobServiceClient
    );

    // List all blobs in the container with the specified directory path
    const blobs = await containerClient.listBlobsByHierarchy(directoryPath);

    // Ensure directory path uses forward slashes for consistency
    const updatedPath = directoryPath.replace(/\\/g, "/");

    // Delete each blob within the specified directory path
    for await (const blob of blobs) {
      if (blob.name.startsWith(updatedPath)) {
        const blobClient = await containerClient.getBlobClient(blob.name);
        await blobClient.delete();
      }
    }
  } catch (error) {
    // Throw an error if any step encounters an issue during directory deletion
    throw new Error(
      `Error deleting directory "${directoryPath}": ${error.message}`
    );
  }
};

export default upload;
