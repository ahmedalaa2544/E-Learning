import {
  BlobSASPermissions,
  BlobServiceClient,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

async function createContainer(containerName, blobServiceClient) {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();

  return containerClient;
}
async function getBlobServiceClient(serviceName, serviceKey) {
  const sharedKeyCredential = new StorageSharedKeyCredential(
    serviceName,
    serviceKey
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${serviceName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  return blobServiceClient;
}

export const generateSASUrl = async (
  serviceName,
  serviceKey,
  containerName,
  fileName, // hierarchy of folders and file name: 'folder1/folder2/filename.ext'
  permissions = "r", // default read only
  timerange = 1 // default 1 minute
) => {
  if (!serviceName || !serviceKey || !fileName || !containerName) {
    return "Generate SAS function missing parameters";
  }

  const blobServiceClient = await getBlobServiceClient(serviceName, serviceKey);
  const containerClient = await createContainer(
    containerName,
    blobServiceClient
  );
  const blockBlobClient = await containerClient.getBlockBlobClient(fileName);

  // Best practice: create time limits
  const SIXTY_MINUTES = timerange * 60 * 1000;
  const NOW = new Date();

  // Create SAS URL
  const accountSasTokenUrl = await blockBlobClient.generateSasUrl({
    startsOn: NOW,
    expiresOn: new Date(new Date().valueOf() + SIXTY_MINUTES),
    permissions: BlobSASPermissions.parse(permissions), // Read only permission to the blob
    protocol: SASProtocol.Https, // Only allow HTTPS access to the blob
  });

  return {
    accountSasTokenUrl: accountSasTokenUrl,
    fileUrl: blockBlobClient.url,
  };
};

export default generateSASUrl;
