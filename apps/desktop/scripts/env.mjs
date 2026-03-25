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

function getRequiredEnvList(names) {
  const missing = names.filter((name) => !getOptionalEnv(name));

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function getAutoUpdateBaseUrl() {
  return getRequiredEnv("AUTO_UPDATE_BASE_URL");
}

export function getPublisherEnv(options = {}) {
  const { requirePublish = false } = options;

  if (requirePublish) {
    getRequiredEnvList([
      "AUTO_UPDATE_S3_BUCKET",
      "AUTO_UPDATE_S3_REGION",
      "AUTO_UPDATE_S3_ENDPOINT",
      "AUTO_UPDATE_S3_ACCESS_KEY_ID",
      "AUTO_UPDATE_S3_SECRET_ACCESS_KEY",
    ]);
  }

  const bucket = getOptionalEnv("AUTO_UPDATE_S3_BUCKET");
  const region = getOptionalEnv("AUTO_UPDATE_S3_REGION");

  return {
    accessKeyId: getOptionalEnv("AUTO_UPDATE_S3_ACCESS_KEY_ID"),
    bucket,
    endpoint: getOptionalEnv("AUTO_UPDATE_S3_ENDPOINT"),
    folder: getOptionalEnv("AUTO_UPDATE_S3_FOLDER"),
    omitAcl: process.env.AUTO_UPDATE_S3_OMIT_ACL === "true",
    region,
    s3ForcePathStyle: process.env.AUTO_UPDATE_S3_FORCE_PATH_STYLE === "true",
    secretAccessKey: getOptionalEnv("AUTO_UPDATE_S3_SECRET_ACCESS_KEY"),
    sessionToken: getOptionalEnv("AUTO_UPDATE_S3_SESSION_TOKEN"),
    shouldPublish: Boolean(bucket && region),
  };
}
