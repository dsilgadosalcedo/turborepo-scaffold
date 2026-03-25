function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name) {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

export function getAutoUpdateBaseUrl() {
  return getRequiredEnv("AUTO_UPDATE_BASE_URL");
}

export function getPublisherEnv() {
  return {
    accessKeyId: getOptionalEnv("AUTO_UPDATE_S3_ACCESS_KEY_ID"),
    bucket: getOptionalEnv("AUTO_UPDATE_S3_BUCKET"),
    endpoint: getOptionalEnv("AUTO_UPDATE_S3_ENDPOINT"),
    folder: getOptionalEnv("AUTO_UPDATE_S3_FOLDER"),
    omitAcl: process.env.AUTO_UPDATE_S3_OMIT_ACL === "true",
    region: getOptionalEnv("AUTO_UPDATE_S3_REGION"),
    s3ForcePathStyle: process.env.AUTO_UPDATE_S3_FORCE_PATH_STYLE === "true",
    secretAccessKey: getOptionalEnv("AUTO_UPDATE_S3_SECRET_ACCESS_KEY"),
    sessionToken: getOptionalEnv("AUTO_UPDATE_S3_SESSION_TOKEN"),
  };
}
