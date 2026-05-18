import { NextRequest, NextResponse } from "next/server";

const TASTY_KEY = process.env.TASTY_API_KEY;
const TASTY_BASE = "https://tasty.p.rapidapi.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tags = searchParams.get("tags") || "";
  const excludeId = searchParams.get("exclude") || "";

  try {
    const res = await fetch(
      `${TASTY_BASE}/recipes/list?from=0&size=12${tags ? `&tags=${encodeURIComponent(tags)}` : ""}`,
      {
        headers: {
          "x-rapidapi-host": "tasty.p.rapidapi.com",
          "x-rapidapi-key": TASTY_KEY || "",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return NextResponse.json({ videos: [] });
    const data = await res.json();

    const videos = (data.results || [])
      .filter((r: Record<string, unknown>) =>
        r.id &&
        (r.original_video_url || r.video_url) &&
        String(r.id) !== excludeId
      )
      .slice(0, 6)
      .map((r: Record<string, unknown>) => ({
        id: `tasty_${r.id}`,
        title: r.name,
        thumbnail: r.thumbnail_url || null,
        videoUrl: r.original_video_url || r.video_url,
        time: r.total_time_minutes ? `${r.total_time_minutes} min` : null,
      }));

    return NextResponse.json({ videos }, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ videos: [] });
  }
}
