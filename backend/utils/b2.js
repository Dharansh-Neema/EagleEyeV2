const B2 = require('backblaze-b2');
require('dotenv').config();

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

async function authorize() {
  if (!b2.authorized) {
    await b2.authorize();
  }
}

async function uploadFile(fileBuffer, path, mimeType) {
  await authorize();
  const bucketName = process.env.B2_BUCKET_NAME;
  const folder = process.env.B2_BUCKET_FOLDER || '';
  const filePath = folder ? `${folder}/${path}` : path;

  // Get upload URL
  const { data: { uploadUrl, authorizationToken } } = await b2.getUploadUrl({
    bucketId: (await b2.getBucket({ bucketName })).data.buckets[0].bucketId,
  });

  // Upload file
  const uploadRes = await b2.uploadFile({
    uploadUrl,
    uploadAuthToken: authorizationToken,
    fileName: filePath,
    data: fileBuffer,
    mime: mimeType,
  });

  // Return the B2 file path (store this in MongoDB)
  return {
    path: uploadRes.data.fileName,
    url: `https://${bucketName}.s3.us-west-004.backblazeb2.com/${uploadRes.data.fileName}`,
  };
}

async function deleteFile(path) {
  await authorize();
  const bucketName = process.env.B2_BUCKET_NAME;
  const bucketId = (await b2.getBucket({ bucketName })).data.buckets[0].bucketId;

  // Get fileId
  const { data: { files } } = await b2.listFileNames({ bucketId, prefix: path, maxFileCount: 1 });
  if (files.length === 0) return;
  await b2.deleteFileVersion({
    fileName: path,
    fileId: files[0].fileId,
  });
}

/**
 * Generate a public URL for a B2 file
 * @param {string} path - The path of the file in B2
 * @returns {string} - The public URL
 */
function getPublicUrl(path) {
  // The format depends on your B2 bucket setup - this assumes public bucket
  const bucketName = process.env.B2_BUCKET_NAME;
  return `https://${bucketName}.s3.us-west-004.backblazeb2.com/${path}`;
}

module.exports = { uploadFile, deleteFile, getPublicUrl };