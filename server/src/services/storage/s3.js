/**
 * AWS S3 driver. Install the SDK first:  npm i @aws-sdk/client-s3
 * Credentials are read from the standard AWS env vars / instance role.
 * The bucket must block all public access; objects are encrypted at rest.
 */
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

let sdk;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  sdk = require('@aws-sdk/client-s3');
} catch {
  throw new Error('STORAGE_DRIVER=s3 requires the AWS SDK: run `npm i @aws-sdk/client-s3` in /server');
}

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = sdk;
const { bucket, region } = env.storage.s3;
if (!bucket || !region) throw new Error('AWS_S3_BUCKET and AWS_REGION must be set for the s3 storage driver');

const client = new S3Client({ region });

module.exports = {
  async save(key, buffer, mimeType) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `resumes/${key}`,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      })
    );
  },
  async stream(key) {
    try {
      const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: `resumes/${key}` }));
      return out.Body;
    } catch (e) {
      if (e.name === 'NoSuchKey') throw ApiError.notFound('Resume file not found in storage');
      throw e;
    }
  },
  async remove(key) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: `resumes/${key}` }));
  },
};
