const DOWNLOAD_COUNT_KEY = "called-for-more:downloads";
const STARTING_COUNT = 50;

// Initialize the counter once, then increment atomically to avoid lost updates
// when several readers download at the same time.
const COUNTER_SCRIPT = `
local value = redis.call("GET", KEYS[1])
if not value then
  redis.call("SET", KEYS[1], ARGV[1])
  value = ARGV[1]
end
if ARGV[2] == "increment" then
  value = redis.call("INCR", KEYS[1])
end
return value
`;

async function getDownloadCount(action) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis is not configured");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      "EVAL",
      COUNTER_SCRIPT,
      "1",
      DOWNLOAD_COUNT_KEY,
      String(STARTING_COUNT),
      action,
    ]),
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || "Redis request failed");
  }
  return Number(result.result);
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const downloads = await getDownloadCount(
      req.method === "POST" ? "increment" : "read",
    );
    return res.status(200).json({ downloads });
  } catch (error) {
    console.error("Download counter error:", error.message);
    return res.status(503).json({ error: "Download counter unavailable" });
  }
};
