import {
  FullScraperEvents,
  RunOutput,
  ScrapeMedia,
} from "@movie-web/providers";

import { conf } from "@/setup/config";

export async function scrapeViaFedApi(
  media: ScrapeMedia,
  events?: {
    init: NonNullable<FullScraperEvents["init"]>;
    start: NonNullable<FullScraperEvents["start"]>;
    update: NonNullable<FullScraperEvents["update"]>;
  },
): Promise<RunOutput | null> {
  if (!conf().ALLOW_FEBBOX_KEY) return null;

  const apiUrl = conf().FEBBOX_API_URL;
  if (!apiUrl) return null;

  try {
    if (events) {
      events.init({ sourceIds: ["febbox"] });
      events.start("febbox");
      events.update({
        id: "febbox",
        status: "pending",
        percentage: 0,
        reason: "Searching Febbox...",
      });
    }

    const url = new URL(`${apiUrl}/api/febbox/stream`);
    url.searchParams.set("type", media.type);
    url.searchParams.set("title", media.title);
    url.searchParams.set("releaseYear", media.releaseYear.toString());

    if (media.tmdbId) url.searchParams.set("tmdbId", media.tmdbId.toString());
    if (media.imdbId) url.searchParams.set("imdbId", media.imdbId);

    if (media.type === "show") {
      url.searchParams.set("season", media.season.number.toString());
      url.searchParams.set("episode", media.episode.number.toString());
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      // Ensure we don't cache this aggressively
      cache: "no-store",
    });

    if (!response.ok) {
      if (events)
        events.update({
          id: "febbox",
          status: "notfound",
          percentage: 100,
          reason: `Failed with status ${response.status}`,
        });
      return null;
    }

    const data = await response.json();
    if (data.error || !data.links || data.links.length === 0) {
      if (events)
        events.update({
          id: "febbox",
          status: "notfound",
          percentage: 100,
          reason: data.error || "No links found",
        });
      return null;
    }

    const qualities: Record<string, any> = {};
    let hasLinks = false;

    data.links.forEach((link: any) => {
      let q = link.quality.toLowerCase();
      // Map to movie-web formats: 4k, 1080, 720, 480, 360, unknown
      if (q === "4k" || q === "2160p") q = "4k";
      else if (q === "1080p") q = "1080";
      else if (q === "720p") q = "720";
      else if (q === "480p") q = "480";
      else if (q === "360p") q = "360";
      else q = "unknown";

      qualities[q] = {
        type: "mp4",
        url: link.url,
      };
      hasLinks = true;
    });

    if (!hasLinks) {
      if (events)
        events.update({
          id: "febbox",
          status: "notfound",
          percentage: 100,
          reason: "No qualities found",
        });
      return null;
    }

    if (events)
      events.update({ id: "febbox", status: "success", percentage: 100 });

    return {
      sourceId: "febbox",
      embedId: "febbox",
      stream: {
        id: "primary",
        type: "file",
        flags: [],
        captions: [],
        qualities,
      },
    };
  } catch (err: any) {
    console.error("Febbox scraper error:", err);
    if (events)
      events.update({
        id: "febbox",
        status: "failure",
        percentage: 100,
        error: err.message,
      });
    return null;
  }
}
