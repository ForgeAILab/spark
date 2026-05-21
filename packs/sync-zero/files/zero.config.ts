type ZeroCacheConfig = {
  upstreamDB: string;
  authSecret: string;
  queryURL: string;
  mutateURL: string;
};

export function getZeroCacheConfig(): ZeroCacheConfig {
  const upstreamDB = process.env.ZERO_UPSTREAM_DB;
  const authSecret = process.env.ZERO_AUTH_SECRET;

  if (!upstreamDB) {
    throw new Error("ZERO_UPSTREAM_DB is required to run zero-cache.");
  }

  if (!authSecret) {
    throw new Error("ZERO_AUTH_SECRET is required to authenticate Zero clients.");
  }

  return {
    upstreamDB,
    authSecret,
    queryURL: "http://localhost:3000/api/query",
    mutateURL: "http://localhost:3000/api/mutate",
  };
}
