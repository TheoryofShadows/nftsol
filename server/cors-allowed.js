export default function corsAllowed(req, res, next) {
    const list = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    // Always allow local dev UI
    if (!list.includes("http://localhost:3000"))
        list.push("http://localhost:3000");
    if (!list.includes("http://localhost:5173"))
        list.push("http://localhost:5173");
    if (!list.includes("https://nftsolmarket.netlify.app"))
        list.push("https://nftsolmarket.netlify.app");
    const allowed = new Set(list);
    const origin = req.headers.origin;
    if (origin && allowed.has(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS")
        return res.sendStatus(204);
    next();
}
