import { isRecentRelease, nodeReleaseSchema, type NodeRelease } from "../src/muse/nodeRelease.ts";

const source = "https://nodejs.org/dist/index.json";
const publicCache = { "Cache-Control": "public, max-age=300, s-maxage=3600" };

export function selectNodeRelease(feed: unknown, now: Date): NodeRelease | null {
  if (!Array.isArray(feed)) return null;
  let latest: NodeRelease | null = null;

  for (const entry of feed) {
    const parsed = nodeReleaseSchema.safeParse(entry);
    if (!parsed.success || typeof entry.lts !== "string" || !entry.lts) continue;

    const release = parsed.data;
    // Skip routine patch bumps unless the official index marks them as security releases.
    if (!release.security && !release.version.endsWith(".0")) continue;
    if (!isRecentRelease(release.date, now)) continue;
    if (!latest || release.date > latest.date || (release.date === latest.date && release.security && !latest.security)) {
      latest = release;
    }
  }

  return latest;
}

export async function GET(): Promise<Response> {
  try {
    const response = await fetch(source, {
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Release index unavailable");
    const feed: unknown = await response.json();
    if (!Array.isArray(feed) || !feed.length) throw new Error("Invalid release index");
    return Response.json(selectNodeRelease(feed, new Date()), { headers: publicCache });
  } catch {
    return Response.json(null, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
