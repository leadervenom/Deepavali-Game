// Phones-down bell. GET = anyone (players poll). POST = narrator only (passcode).
// Storage: Upstash Redis REST (Vercel Marketplace sets KV_REST_API_* or UPSTASH_REDIS_REST_*).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "bell";

async function redis(cmd) {
  const r = await fetch(URL_, { method: "POST", headers: { Authorization: "Bearer " + TOKEN }, body: JSON.stringify(cmd) });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (!URL_ || !TOKEN) { res.statusCode = 503; return res.end('{"error":"storage not configured"}'); }
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "public, s-maxage=2");
      const v = await redis(["GET", KEY]);
      return res.end(v || '{"id":0,"down":false}');
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const pass = String(body.pass || "").trim().toUpperCase();
      if (!process.env.NARRATOR_PASS || pass !== process.env.NARRATOR_PASS.trim().toUpperCase()) {
        res.statusCode = 401; return res.end('{"error":"bad passcode"}');
      }
      const state = JSON.stringify({ id: Date.now(), down: !!body.down });
      await redis(["SET", KEY, state, "EX", 21600]);
      res.setHeader("Cache-Control", "no-store");
      return res.end(state);
    }
    res.statusCode = 405; res.end('{"error":"method"}');
  } catch (e) {
    res.statusCode = 500; res.end('{"error":"server"}');
  }
};
