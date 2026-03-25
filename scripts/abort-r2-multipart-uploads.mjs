import {
  AbortMultipartUploadCommand,
  ListMultipartUploadsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function toPrefix(value) {
  const trimmed = value.trim().replace(/^\/+/u, "").replace(/\/+$/u, "");
  return trimmed ? `${trimmed}/` : "";
}

function createS3Client({
  accessKeyId,
  endpoint,
  forcePathStyle,
  region,
  secretAccessKey,
  sessionToken,
}) {
  return new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey,
      sessionToken,
    },
    endpoint,
    forcePathStyle,
    region,
  });
}

async function listMultipartUploads(client, bucket, prefix) {
  const uploads = [];
  let keyMarker;
  let uploadIdMarker;

  while (true) {
    const response = await client.send(
      new ListMultipartUploadsCommand({
        Bucket: bucket,
        KeyMarker: keyMarker,
        Prefix: prefix,
        UploadIdMarker: uploadIdMarker,
      }),
    );

    for (const upload of response.Uploads ?? []) {
      if (upload.Key && upload.UploadId && upload.Initiated) {
        uploads.push({
          initiatedAt: new Date(upload.Initiated),
          key: upload.Key,
          uploadId: upload.UploadId,
        });
      }
    }

    if (!response.IsTruncated) {
      break;
    }

    keyMarker = response.NextKeyMarker;
    uploadIdMarker = response.NextUploadIdMarker;
  }

  return uploads;
}

export async function abortMultipartUploads({
  accessKeyId,
  bucket,
  endpoint,
  folder = "",
  forcePathStyle = false,
  maxAgeMinutes = 15,
  region = "auto",
  secretAccessKey,
  sessionToken,
}) {
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing required multipart cleanup environment variables: AUTO_UPDATE_S3_BUCKET, AUTO_UPDATE_S3_ENDPOINT, AUTO_UPDATE_S3_ACCESS_KEY_ID, AUTO_UPDATE_S3_SECRET_ACCESS_KEY.",
    );
  }

  const prefix = toPrefix(folder);
  const client = createS3Client({
    accessKeyId,
    endpoint,
    forcePathStyle,
    region,
    secretAccessKey,
    sessionToken,
  });

  const uploads = await listMultipartUploads(client, bucket, prefix);
  const cutoff = Date.now() - maxAgeMinutes * 60 * 1000;
  const staleUploads = uploads.filter((upload) => upload.initiatedAt.getTime() <= cutoff);

  if (staleUploads.length === 0) {
    console.log(
      `No stale multipart uploads found in ${bucket}/${prefix} older than ${maxAgeMinutes} minute(s).`,
    );
    return;
  }

  console.log(
    `Aborting ${staleUploads.length} stale multipart upload(s) in ${bucket}/${prefix} older than ${maxAgeMinutes} minute(s).`,
  );

  for (const upload of staleUploads) {
    console.log(`Aborting multipart upload for ${upload.key} (${upload.uploadId}).`);
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: upload.key,
        UploadId: upload.uploadId,
      }),
    );
  }

  console.log("Multipart upload cleanup complete.");
}

async function main() {
  const bucket = process.env.AUTO_UPDATE_S3_BUCKET;
  const region = process.env.AUTO_UPDATE_S3_REGION ?? "auto";
  const endpoint = process.env.AUTO_UPDATE_S3_ENDPOINT;
  const accessKeyId = process.env.AUTO_UPDATE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AUTO_UPDATE_S3_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AUTO_UPDATE_S3_SESSION_TOKEN;
  const forcePathStyle = process.env.AUTO_UPDATE_S3_FORCE_PATH_STYLE === "true";
  const folder = process.env.AUTO_UPDATE_S3_FOLDER ?? "";
  const maxAgeMinutes = Number.parseInt(
    process.env.AUTO_UPDATE_MULTIPART_MAX_AGE_MINUTES ?? "15",
    10,
  );

  if (!Number.isInteger(maxAgeMinutes) || maxAgeMinutes < 0) {
    throw new Error("AUTO_UPDATE_MULTIPART_MAX_AGE_MINUTES must be an integer >= 0.");
  }

  await abortMultipartUploads({
    accessKeyId,
    bucket,
    endpoint,
    folder,
    forcePathStyle,
    maxAgeMinutes,
    region,
    secretAccessKey,
    sessionToken,
  });
}

await main();
