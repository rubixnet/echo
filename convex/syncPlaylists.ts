import { internalAction, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function parseISODuration(isoDuration?: string): string {
  if (!isoDuration) return "0:00";
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const formattedSecs = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const formattedMins = String(minutes).padStart(2, "0");
    return `${hours}:${formattedMins}:${formattedSecs}`;
  }

  return `${minutes}:${formattedSecs}`;
}

function cleanPlaylistId(rawId: string): string {
  let cleaned = rawId.trim();
  if (cleaned.includes("list=")) {
    cleaned = cleaned.split("list=")[1].split("&")[0];
  }
  return cleaned;
}

export const CATEGORY_PLAYLISTS = [
  { id: "in-trending", name: "India Top Weekly", playlistId: "PL4fGSI1pDJn4pTWyM3t61lOyZ6_4jcNOw", type: "chart", syncFrequency: "daily" },
  { id: "us", name: "US Top Weekly", playlistId: "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI", type: "chart", syncFrequency: "daily" },
  { id: "global", name: "Global Top Weekly", playlistId: "PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i", type: "chart", syncFrequency: "daily" },
  { id: "uk", name: "UK Top Weekly", playlistId: "PL4fGSI1pDJn6_f5P3MnzXg9l3GDfnSlXa", type: "chart", syncFrequency: "daily" },

  { id: "alternative-indie-rock", name: "Alternative Indie Rock", playlistId: "PLOhV0FrFphUfHqxfhIBju7zu_2CTqG01F", type: "genre", syncFrequency: "weekly" },
  { id: "classic-rock", name: "Classic Rock", playlistId: "PLBD5pRttJ7N0vCfh4NpEg7Vw47hfeCxuE", type: "genre", syncFrequency: "weekly" },
  { id: "punk-rock", name: "Punk Rock", playlistId: "PLyYSaNJm9DA_W3nklWZXZ3mk1XNWBwkun", type: "genre", syncFrequency: "weekly" },
  { id: "grunge", name: "Grunge", playlistId: "PLWakprYDm3c_gBFDNMHoaPi5pZMjNjx36", type: "genre", syncFrequency: "weekly" },
  { id: "psychedelic-rock", name: "Psychedelic Rock", playlistId: "PL_9KyubuEEgj0bnDQLap-VCbf78n6On5Z", type: "genre", syncFrequency: "weekly" },
  { id: "heavy-metal", name: "Heavy Metal", playlistId: "PLmXxqSJJq-yUwqtbp8MHBoTDoDULMoViq", type: "genre", syncFrequency: "weekly" },
  { id: "death-black-metal", name: "Death Black Metal", playlistId: "PLXH3ukits4dlWBzLuK2DBHTRQBR1D49tB", type: "genre", syncFrequency: "weekly" },
  { id: "metalcore-nu-metal", name: "Metalcore Nu-Metal", playlistId: "PLBzQNon23X7iDwsZoVZM4Rr89LTSttT98", type: "genre", syncFrequency: "weekly" },
  { id: "prog-rock", name: "Prog Rock", playlistId: "PL3wn1snc_CK2qKoweds_jQUpFszbqcVdE", type: "genre", syncFrequency: "weekly" },
  { id: "house-deep-tech", name: "House Deep Tech Electro", playlistId: "PLWcttt0SQjI_i-Hgib9xytPKPscMPFSlL", type: "genre", syncFrequency: "weekly" },
  { id: "techno", name: "Techno", playlistId: "PLaLWNpJCbH_pJ23YMJd-0ob6bB8iQm0bS", type: "genre", syncFrequency: "weekly" },
  { id: "trance", name: "Trance", playlistId: "PLOwSo8kHs4XSqVqTSuua8PguWV0AWB1RE", type: "genre", syncFrequency: "weekly" },
  { id: "drum-and-bass", name: "Drum and Bass", playlistId: "PLMmqTuUsDkRIZ1C1T2AsVz5XIxtVDfSOe", type: "genre", syncFrequency: "weekly" },
  { id: "dubstep", name: "Dubstep", playlistId: "PLJtpjlkBVF4yJVPNl6mYT30IcvFtoWDu3", type: "genre", syncFrequency: "weekly" },
  { id: "ambient-chillout", name: "Ambient Chillout", playlistId: "PLTRU2u_bXJopqmr-9ZK5fayhCzH_BdWjG", type: "genre", syncFrequency: "weekly" },
  { id: "synthwave-retrowave", name: "Synthwave Retrowave", playlistId: "PLOtNYlNIGer0jmWpFtTWqMkfP56iuZg1w", type: "genre", syncFrequency: "weekly" },
  { id: "hardstyle", name: "Hardstyle", playlistId: "PLCzN_TexTM4U5pklGAeSbA1KhXsQrGo9i", type: "genre", syncFrequency: "weekly" },
  { id: "idm", name: "IDM Intelligent Dance Music", playlistId: "PL4ZNQcArsz2ZOOdVmD1dDkNfFL4swdX14", type: "genre", syncFrequency: "weekly" },
  { id: "boom-bap", name: "Boom Bap Old School Hip-Hop", playlistId: "PL760D537A970662F3", type: "genre", syncFrequency: "weekly" },
  { id: "trap", name: "Trap", playlistId: "PLJd2Uv17VZz9w3r1fwoAMPjAhtLTpPiUa", type: "genre", syncFrequency: "weekly" },
  { id: "contemporary-rnb", name: "Contemporary R&B", playlistId: "PLHg022HMFzFB7nKvmuvpyGTDPCV7-A8ux", type: "genre", syncFrequency: "weekly" },
  { id: "neo-soul", name: "Neo-Soul", playlistId: "PLxgRj-sFI57ChVko24XjBaHVGmTJNpqiM", type: "genre", syncFrequency: "weekly" },
  { id: "90s-2000s-rnb", name: "90s 2000s R&B", playlistId: "PLcPsTx18zxlHa_ACeNC_mMirAth-oNz84", type: "genre", syncFrequency: "weekly" },
  { id: "grime-uk-drill", name: "Grime UK Drill", playlistId: "PL8A3BqBeMvue3S4b9buMNh1_blEBpI8_A", type: "genre", syncFrequency: "weekly" },
  { id: "conscious-rap", name: "Conscious Rap", playlistId: "PLFW906LqytS9txkGGZhqAzlaRYFaTSUfb", type: "genre", syncFrequency: "weekly" },
  { id: "traditional-swing-jazz", name: "Traditional Swing Jazz", playlistId: "PLF4noIcOSXnvuluLjMOCElbMUXTIzXxqc", type: "genre", syncFrequency: "weekly" },
  { id: "bossa-nova", name: "Bossa Nova", playlistId: "PLFCKY2xPd4VXmMGs8cg5lBhc6sz3wLm1a", type: "genre", syncFrequency: "weekly" },
  { id: "fusion-jazz", name: "Fusion Jazz", playlistId: "PLle7_Qoyh5w1kItfdLfHyOUfUdTdWBY01", type: "genre", syncFrequency: "weekly" },
  { id: "delta-chicago-blues", name: "Delta Chicago Blues", playlistId: "PLp31bdWe7pFBcM-Hi9182dslJhbxPNEw6", type: "genre", syncFrequency: "weekly" },
  { id: "gospel", name: "Gospel", playlistId: "PLmGouTBbived7Cy0F795kR2c_GEfa-Z-T", type: "genre", syncFrequency: "weekly" },
  { id: "motown-classic-soul", name: "Motown Classic Soul", playlistId: "PL8Lpw39GxwbMmEubwes0T21sqGFyaN7JN", type: "genre", syncFrequency: "weekly" },
  { id: "funk", name: "Funk", playlistId: "PLGBKsNyGY-afVCvIkhgvIvz6nOaL7WfLh", type: "genre", syncFrequency: "weekly" },
  { id: "traditional-country", name: "Traditional Country", playlistId: "PL3oW2tjiIxvQW6c-4Iry8Bpp3QId40S5S", type: "genre", syncFrequency: "weekly" },
  { id: "modern-pop-country", name: "Modern Pop Country", playlistId: "PLN_YZjgdIDCfYxxFZW4TFKiFNraH6d9hK", type: "genre", syncFrequency: "weekly" },
  { id: "bluegrass", name: "Bluegrass", playlistId: "PLKUA473MWUv2mddNMPh-MJkgTR5AjTpl3", type: "genre", syncFrequency: "weekly" },
  { id: "americana", name: "Americana", playlistId: "PLLy1F0NPv5gqf2pGqghLc7YS2zDFOae4u", type: "genre", syncFrequency: "weekly" },
  { id: "contemporary-folk", name: "Contemporary Folk", playlistId: "PLgny6od8NsR7thUvqvnlaYy6tr02SIeCy", type: "genre", syncFrequency: "weekly" },
  { id: "celtic-folk", name: "Celtic Folk", playlistId: "PLAt-IVDC3ws3c8kb__ttmqQ2nXiKQUWom", type: "genre", syncFrequency: "weekly" },
  { id: "baroque-classical", name: "Baroque Classical Era", playlistId: "PLcGkkXtask_clYSk4gXUAjfpquAo_lE9W", type: "genre", syncFrequency: "weekly" },
  { id: "romantic-classical", name: "Romantic Era Classical", playlistId: "PLZSHe_0xk6Mg0Oz8CYswTvHwZ0JrLG-KC", type: "genre", syncFrequency: "weekly" },
  { id: "modern-classical", name: "Modern Classical Minimalist", playlistId: "PLjFCzsczxKCUlAyY9Al_cgWrcKQSTlWnu", type: "genre", syncFrequency: "weekly" },
  { id: "cinematic-film-score", name: "Cinematic Film Score", playlistId: "PL4BrNFx1j7E5qDxSPIkeXgBqX0J7WaB2a", type: "genre", syncFrequency: "weekly" },
  { id: "ambient-instrumental", name: "Ambient Instrumental", playlistId: "PL290F940EDA519EB6", type: "genre", syncFrequency: "weekly" },
  { id: "opera", name: "Opera", playlistId: "PLOwSo8kHs4XT4Hx7OufxbXJLestNUWg7F", type: "genre", syncFrequency: "weekly" },
  { id: "afrobeats", name: "Afrobeats", playlistId: "PLm90DCMQmtlmGhRX5MuLBafqpq3cvUHWz", type: "genre", syncFrequency: "weekly" },
  { id: "reggae-dancehall", name: "Reggae Dancehall", playlistId: "PLnna6JHCnZnyUEyt4eVt3-DaDboYXCALa", type: "genre", syncFrequency: "weekly" },
  { id: "salsa-bachata", name: "Salsa Bachata Merengue", playlistId: "PLWQLazBs82Gg6-VUJC6QUhY0crkjaxWWZ", type: "genre", syncFrequency: "weekly" },
  { id: "reggaeton-latin-trap", name: "Reggaeton Latin Trap", playlistId: "PLa5wFgN-_u1sAhWOfzQ4pyL1pvpQ4KKvb", type: "genre", syncFrequency: "weekly" },
  { id: "kpop-jpop", name: "K-Pop J-Pop", playlistId: "PLaodxkj-4NkSJ3vCfuFytfP29lgH3Eb1S", type: "genre", syncFrequency: "weekly" },
  { id: "flamenco", name: "Flamenco", playlistId: "PL4jrh8b84UikGEdBZdsetJv5xC0P2wkDT", type: "genre", syncFrequency: "weekly" },
  { id: "celtic-irish", name: "Celtic Irish Traditional", playlistId: "PL6WWUJzS8jrWDedoV3bKEysrPpIbdfJGf", type: "genre", syncFrequency: "weekly" },
  { id: "mainstream-top-40", name: "Mainstream Top 40", playlistId: "PLO7-VO1D0_6No4YpDVJxBT5wMkbHX_MuG", type: "genre", syncFrequency: "weekly" },
  { id: "synth-pop", name: "Synth-Pop", playlistId: "PLEXox2R2RxZKyTTlt3kxvtJbI_Cw1K1IX", type: "genre", syncFrequency: "weekly" },
  { id: "indie-pop", name: "Indie Pop", playlistId: "PL1gfuz7ZYcaM2Z7sCGOWORCF0CGmonzOv", type: "genre", syncFrequency: "weekly" },
  { id: "dance-pop", name: "Dance-Pop", playlistId: "PLesm76O8GFZOpPPwQtFA5X5Q-Q694_DNU", type: "genre", syncFrequency: "weekly" },
  { id: "art-pop", name: "Art Pop", playlistId: "PLWqkuSwyIh0-J3DMjQaW8ACcrozYKsx08", type: "genre", syncFrequency: "weekly" },
  { id: "ska", name: "Ska", playlistId: "PLcM4ZwI542CpvxGYARIo66SU4917w7y7F", type: "genre", syncFrequency: "weekly" },
  { id: "industrial", name: "Industrial", playlistId: "PL_Bfa8M2QionKDqw_k_3fBoTjatIkYSAF", type: "genre", syncFrequency: "weekly" },
  { id: "noise-experimental", name: "Noise Experimental", playlistId: "PLVx6HpgGCDbGspTo7ECzjq6KykGXBmbVn", type: "genre", syncFrequency: "weekly" },
  { id: "darkwave-goth", name: "Darkwave Goth Rock", playlistId: "PL_ZjJujLae3zfnAXqWW_eO-ygNEc0FCxs", type: "genre", syncFrequency: "weekly" },
  { id: "hyperpop", name: "Hyperpop", playlistId: "PLnDOQeQJN27Bty6fdKf-1u-cqu07DCwvy", type: "genre", syncFrequency: "weekly" },
];

export const syncPlaylistsByFrequency = internalAction({
  args: {
    frequency: v.optional(v.string()), // "daily" | "weekly" | "all"
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error("[CRITICAL] YOUTUBE_API_KEY missing in Convex environment.");
      return;
    }

    const targetFrequency = args.frequency || "all";
    const filteredPlaylists = CATEGORY_PLAYLISTS.filter(
      (item) => targetFrequency === "all" || item.syncFrequency === targetFrequency
    );

    console.log(`[SYNC RUN] Processing ${filteredPlaylists.length} categories (Mode: ${targetFrequency})...`);

    for (const item of filteredPlaylists) {
      try {
        const cleanId = cleanPlaylistId(item.playlistId);
        console.log(`[PROCESSING] "${item.name}" (Sanitized ID: ${cleanId})`);

        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${cleanId}&key=${apiKey}`;
        const res = await fetch(playlistUrl);
        const playlistData = await res.json();

        if (!playlistData.items || !Array.isArray(playlistData.items) || playlistData.items.length === 0) {
          console.warn(`[SYNC SKIP] No items returned for "${item.name}". Message: ${playlistData.error?.message || "Empty payload"}`);
          continue;
        }

        const validItems = playlistData.items.filter(
          (entry: any) =>
            entry?.snippet?.resourceId?.videoId &&
            entry?.snippet?.title !== "Private video" &&
            entry?.snippet?.title !== "Deleted video"
        );

        const videoIds = validItems.map((entry: any) => entry.snippet.resourceId.videoId);

        // Batch fetch exact MM:SS Durations
        const durationMap = new Map<string, string>();
        if (videoIds.length > 0) {
          try {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(",")}&key=${apiKey}`;
            const videosRes = await fetch(videosUrl);
            const videosData = await videosRes.json();

            if (videosData.items) {
              for (const vObj of videosData.items) {
                const rawIso = vObj.contentDetails?.duration;
                durationMap.set(vObj.id, parseISODuration(rawIso));
              }
            }
          } catch (err) {
            console.warn(`[DURATION WARN] Could not fetch durations for "${item.name}"`);
          }
        }

        const tracks = validItems.map((entry: any, index: number) => {
          const videoId = String(entry.snippet.resourceId.videoId);
          const thumbnails = entry.snippet?.thumbnails;
          const thumbnail =
            thumbnails?.high?.url ||
            thumbnails?.medium?.url ||
            thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const rawArtist =
            entry.snippet?.videoOwnerChannelTitle ||
            entry.snippet?.channelTitle ||
            "Unknown Artist";

          return {
            youtubeId: videoId,
            title: String(entry.snippet?.title || "Untitled Track"),
            artist: String(rawArtist).replace(" - Topic", "").trim() || "Unknown Artist",
            thumbnail: String(thumbnail),
            duration: durationMap.get(videoId) || "3:30",
            order: index,
          };
        });

        await ctx.runMutation(internal.syncPlaylists.replaceCategoryTracks, {
          categoryId: item.id,
          name: item.name,
          type: item.type,
          playlistId: item.playlistId,
          tracks,
        });

        console.log(`[SYNC SUCCESS] Saved ${tracks.length} tracks for "${item.name}"`);
      } catch (err) {
        console.error(`[SYNC ERROR] Failed processing "${item.name}":`, err);
      }
    }

    console.log("[SYNC RUN COMPLETE]");
  },
});

export const replaceCategoryTracks = internalMutation({
  args: {
    categoryId: v.string(),
    name: v.string(),
    type: v.string(),
    playlistId: v.string(),
    tracks: v.array(
      v.object({
        youtubeId: v.string(),
        title: v.string(),
        artist: v.string(),
        thumbnail: v.string(),
        duration: v.string(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        type: args.type,
        playlistId: args.playlistId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("categories", {
        categoryId: args.categoryId,
        name: args.name,
        type: args.type,
        playlistId: args.playlistId,
        updatedAt: Date.now(),
      });
    }

    const oldTracks = await ctx.db
      .query("category_tracks")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    for (const t of oldTracks) {
      await ctx.db.delete(t._id);
    }

    for (const t of args.tracks) {
      await ctx.db.insert("category_tracks", {
        categoryId: args.categoryId,
        ...t,
      });
    }
  },
});

export const getCategoryTracks = query({
  args: { categoryId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("category_tracks")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});