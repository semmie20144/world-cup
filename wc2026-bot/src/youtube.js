import axios from "axios";

const YT_API_KEY = process.env.YOUTUBE_API_KEY ?? "";

export async function searchWC2026Videos(query) {
  if (!YT_API_KEY) return [];
  try {
    const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: YT_API_KEY,
        q: `FIFA World Cup 2026 ${query}`,
        part: "snippet",
        type: "video",
        order: "date",
        maxResults: 3,
        relevanceLanguage: "en",
      },
    });
    return (res.data.items ?? []).map((item) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails?.high?.url ?? "",
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch { return []; }
}

export async function getLatestHighlights() {
  return searchWC2026Videos("highlights goals");
}
