import { NextRequest, NextResponse } from "next/server";

const TASTY_KEY = process.env.TASTY_API_KEY;
const TASTY_BASE = "https://tasty.p.rapidapi.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const size = Math.min(Number(searchParams.get("size") || 9), 20);

  try {
    const params = new URLSearchParams({
      from: "0",
      size: String(size),
    });
    if (query) params.set("q", query);

    const res = await fetch(`${TASTY_BASE}/recipes/list?${params}`, {
      headers: {
        "x-rapidapi-host": "tasty.p.rapidapi.com",
        "x-rapidapi-key": TASTY_KEY || "",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Tasty error: ${res.status}`);
    const data = await res.json();

    const videos = (data.results || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => (r.original_video_url || r.video_url) && r.thumbnail_url && r.name)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => ({
        id: `tasty_${r.id}`,
        title: r.name,
        image: r.thumbnail_url,
        videoUrl: r.original_video_url || r.video_url, // MP4 first, HLS fallback
        source: "Tasty",
        sourceUrl: `https://tasty.co/recipe/${r.slug || r.id}`,
        time: r.total_time_minutes ? `${r.total_time_minutes} min` : null,
        servings: r.yields || null,
      }));

    return NextResponse.json({ videos });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ videos: [] });
  }
}
