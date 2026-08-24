import { google } from 'googleapis';

const API_KEY = 'YOUR_YOUTUBE_API_KEY';

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY,
});

const YOUTUBE_MUSIC_CHANNEL_ID = 'UC-9-kyTW8ZkZNDHQJ6FgpwQ';

const genres = [
  "Alternative Indie Rock",
  "Classic Rock",
  "Punk Rock",
  "Grunge",
  "Psychedelic Rock",
  "Heavy Metal",
  "Death Black Metal",
  "Metalcore Nu-Metal",
  "Prog Rock",

  "House Deep Tech Electro",
  "Techno",
  "Trance",
  "Drum and Bass",
  "Dubstep",
  "Ambient Chillout",
  "Synthwave Retrowave",
  "Hardstyle",
  "IDM Intelligent Dance Music",

  "Boom Bap Old School Hip Hop",
  "Trap",
  "Contemporary R&B",
  "Neo-Soul",
  "90s 2000s R&B",
  "Grime UK Drill",
  "Conscious Rap",

  "Traditional Swing Jazz",
  "Bossa Nova",
  "Fusion Jazz",
  "Delta Chicago Blues",
  "Gospel",
  "Motown Classic Soul",
  "Funk",

  // 🤠 Country & Folk
  "Traditional Country",
  "Modern Pop Country",
  "Bluegrass",
  "Americana",
  "Contemporary Folk",
  "Celtic Folk",

  "Baroque Classical Era",
  "Romantic Era Classical",
  "Modern Classical Minimalist",
  "Cinematic Film Score",
  "Ambient Instrumental",
  "Opera",

  "Afrobeats",
  "Reggae Dancehall",
  "Salsa Bachata Merengue",
  "Reggaeton Latin Trap",
  "K-Pop J-Pop",
  "Flamenco",
  "Celtic Irish Traditional",

  "Mainstream Top 40",
  "Synth Pop",
  "Indie Pop",
  "Dance Pop",
  "Art Pop",

  "Ska",
  "Industrial",
  "Noise Experimental",
  "Darkwave Goth Rock",
  "Hyperpop"
];

async function fetchOfficialPlaylists() {
  const results = {};

  for (const genre of genres) {
    try {
      const response = await youtube.search.list({
        part: ['snippet'],
        channelId: YOUTUBE_MUSIC_CHANNEL_ID,
        q: genre,
        type: ['playlist'],
        maxResults: 5,
      });

      const items = response.data.items;
      let matched = false;

      if (items && items.length > 0) {
        for (const item of items) {
          const pid = item.id.playlistId;
          if (pid.startsWith('RDCLAK')) {
            results[genre] = {
              playlistId: pid,
              title: item.snippet.title,
              musicUrl: `https://music.youtube.com/playlist?list=${pid}`
            };
            console.log(`✅ Official Found: ${genre} -> ${pid}`);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        const fallbackResponse = await youtube.search.list({
          part: ['snippet'],
          q: `"${genre}" "YouTube Music"`,
          type: ['playlist'],
          maxResults: 5,
        });

        const fallbackItems = fallbackResponse.data.items;
        if (fallbackItems) {
          for (const item of fallbackItems) {
            const pid = item.id.playlistId;
            if (pid.startsWith('RDCLAK')) {
              results[genre] = {
                playlistId: pid,
                title: item.snippet.title,
                musicUrl: `https://music.youtube.com/playlist?list=${pid}`
              };
              console.log(`✅ Fallback Official Found: ${genre} -> ${pid}`);
              matched = true;
              break;
            }
          }
        }
      }

      if (!matched) {
        console.log(`⚠️ No official RDCLAK found for: ${genre}`);
      }

    } catch (error) {
      console.error(`Error fetching ${genre}:`, error.message);
    }
  }

  console.log("\n--- OFFICIAL RDCLAK CONFIGURATION ---");
  console.log(JSON.stringify(results, null, 2));
}

fetchOfficialPlaylists();

/*
results: {
  {
    "Alternative Indie Rock": {
      "playlistId": "PLOhV0FrFphUfHqxfhIBju7zu_2CTqG01F",
        "title": "Best Indie Rock Songs/ Alternative Playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PLOhV0FrFphUfHqxfhIBju7zu_2CTqG01F",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLOhV0FrFphUfHqxfhIBju7zu_2CTqG01F"
    },
    "Classic Rock": {
      "playlistId": "PLBD5pRttJ7N0vCfh4NpEg7Vw47hfeCxuE",
        "title": "Best of Classic Rock",
          "musicUrl": "https://music.youtube.com/playlist?list=PLBD5pRttJ7N0vCfh4NpEg7Vw47hfeCxuE",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLBD5pRttJ7N0vCfh4NpEg7Vw47hfeCxuE"
    },
    "Punk Rock": {
      "playlistId": "PLyYSaNJm9DA_W3nklWZXZ3mk1XNWBwkun",
        "title": "90&#39;s - 2000&#39;s Punk/Rock",
          "musicUrl": "https://music.youtube.com/playlist?list=PLyYSaNJm9DA_W3nklWZXZ3mk1XNWBwkun",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLyYSaNJm9DA_W3nklWZXZ3mk1XNWBwkun"
    },
    "Grunge": {
      "playlistId": "PLWakprYDm3c_gBFDNMHoaPi5pZMjNjx36",
        "title": "All Grunge Hits",
          "musicUrl": "https://music.youtube.com/playlist?list=PLWakprYDm3c_gBFDNMHoaPi5pZMjNjx36",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLWakprYDm3c_gBFDNMHoaPi5pZMjNjx36"
    },
    "Psychedelic Rock": {
      "playlistId": "PL_9KyubuEEgj0bnDQLap-VCbf78n6On5Z",
        "title": "60s-70s Stoner/Psychedelic Rock",
          "musicUrl": "https://music.youtube.com/playlist?list=PL_9KyubuEEgj0bnDQLap-VCbf78n6On5Z",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL_9KyubuEEgj0bnDQLap-VCbf78n6On5Z"
    },
    "Heavy Metal": {
      "playlistId": "PLmXxqSJJq-yUwqtbp8MHBoTDoDULMoViq",
        "title": "Greatest Metal Songs of All Time | Best Metal Playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PLmXxqSJJq-yUwqtbp8MHBoTDoDULMoViq",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLmXxqSJJq-yUwqtbp8MHBoTDoDULMoViq"
    },
    "Death Black Metal": {
      "playlistId": "PLXH3ukits4dlWBzLuK2DBHTRQBR1D49tB",
        "title": "Death Metal 101 Playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PLXH3ukits4dlWBzLuK2DBHTRQBR1D49tB",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLXH3ukits4dlWBzLuK2DBHTRQBR1D49tB"
    },
    "Metalcore Nu-Metal": {
      "playlistId": "PLBzQNon23X7iDwsZoVZM4Rr89LTSttT98",
        "title": "90&#39;s-00&#39;s Nu-metal",
          "musicUrl": "https://music.youtube.com/playlist?list=PLBzQNon23X7iDwsZoVZM4Rr89LTSttT98",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLBzQNon23X7iDwsZoVZM4Rr89LTSttT98"
    },
    "Prog Rock": {
      "playlistId": "PL3wn1snc_CK2qKoweds_jQUpFszbqcVdE",
        "title": "[100] Greatest PROG ROCK Songs Of All Time",
          "musicUrl": "https://music.youtube.com/playlist?list=PL3wn1snc_CK2qKoweds_jQUpFszbqcVdE",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL3wn1snc_CK2qKoweds_jQUpFszbqcVdE"
    },
    "House Deep Tech Electro": {
      "playlistId": "PLWcttt0SQjI_i-Hgib9xytPKPscMPFSlL",
        "title": "Tech House &amp; Deep Tech Playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PLWcttt0SQjI_i-Hgib9xytPKPscMPFSlL",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLWcttt0SQjI_i-Hgib9xytPKPscMPFSlL"
    },
    "Techno": {
      "playlistId": "PLaLWNpJCbH_pJ23YMJd-0ob6bB8iQm0bS",
        "title": "Techno 2026 - Techno Playlist - Techno Music 2026 &amp; Techno Songs",
          "musicUrl": "https://music.youtube.com/playlist?list=PLaLWNpJCbH_pJ23YMJd-0ob6bB8iQm0bS",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLaLWNpJCbH_pJ23YMJd-0ob6bB8iQm0bS"
    },
    "Trance": {
      "playlistId": "PLOwSo8kHs4XSqVqTSuua8PguWV0AWB1RE",
        "title": "50 Best Trance Hits Ever - Top Trance Songs of All Time - Music Playlist Updated in 2026",
          "musicUrl": "https://music.youtube.com/playlist?list=PLOwSo8kHs4XSqVqTSuua8PguWV0AWB1RE",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLOwSo8kHs4XSqVqTSuua8PguWV0AWB1RE"
    },
    "Drum and Bass": {
      "playlistId": "PLMmqTuUsDkRIZ1C1T2AsVz5XIxtVDfSOe",
        "title": "Drum &amp; Bass Hits Playlist - Top 100 DnB Songs of 2026",
          "musicUrl": "https://music.youtube.com/playlist?list=PLMmqTuUsDkRIZ1C1T2AsVz5XIxtVDfSOe",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLMmqTuUsDkRIZ1C1T2AsVz5XIxtVDfSOe"
    },
    "Dubstep": {
      "playlistId": "PLJtpjlkBVF4yJVPNl6mYT30IcvFtoWDu3",
        "title": "Dubstep Music 2026 - Top 100 Best Dubstep Songs 2026 (Popular Dubstep Hits 2026 Playlist)",
          "musicUrl": "https://music.youtube.com/playlist?list=PLJtpjlkBVF4yJVPNl6mYT30IcvFtoWDu3",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLJtpjlkBVF4yJVPNl6mYT30IcvFtoWDu3"
    },
    "Ambient Chillout": {
      "playlistId": "PLTRU2u_bXJopqmr-9ZK5fayhCzH_BdWjG",
        "title": "Deep House 2025 - Chill Out Music, Ambient, Chillout Lounge, Relaxing Music 2026",
          "musicUrl": "https://music.youtube.com/playlist?list=PLTRU2u_bXJopqmr-9ZK5fayhCzH_BdWjG",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLTRU2u_bXJopqmr-9ZK5fayhCzH_BdWjG"
    },
    "Synthwave Retrowave": {
      "playlistId": "PLOtNYlNIGer0jmWpFtTWqMkfP56iuZg1w",
        "title": "Chillwave - Synthwave - Retrowave",
          "musicUrl": "https://music.youtube.com/playlist?list=PLOtNYlNIGer0jmWpFtTWqMkfP56iuZg1w",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLOtNYlNIGer0jmWpFtTWqMkfP56iuZg1w"
    },
    "Hardstyle": {
      "playlistId": "PLCzN_TexTM4U5pklGAeSbA1KhXsQrGo9i",
        "title": "Jumpstyle/hardstyle playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PLCzN_TexTM4U5pklGAeSbA1KhXsQrGo9i",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLCzN_TexTM4U5pklGAeSbA1KhXsQrGo9i"
    },
    "IDM Intelligent Dance Music": {
      "playlistId": "PL4ZNQcArsz2ZOOdVmD1dDkNfFL4swdX14",
        "title": "Intelligent Dance Music",
          "musicUrl": "https://music.youtube.com/playlist?list=PL4ZNQcArsz2ZOOdVmD1dDkNfFL4swdX14",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL4ZNQcArsz2ZOOdVmD1dDkNfFL4swdX14"
    },
    "Boom Bap Old School Hip-Hop": {
      "playlistId": "PL760D537A970662F3",
        "title": "Boom Bap 90`s Rap!",
          "musicUrl": "https://music.youtube.com/playlist?list=PL760D537A970662F3",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL760D537A970662F3"
    },
    "Trap": {
      "playlistId": "PLJd2Uv17VZz9w3r1fwoAMPjAhtLTpPiUa",
        "title": "Trap playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PLJd2Uv17VZz9w3r1fwoAMPjAhtLTpPiUa",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLJd2Uv17VZz9w3r1fwoAMPjAhtLTpPiUa"
    },
    "Contemporary R&B": {
      "playlistId": "PLHg022HMFzFB7nKvmuvpyGTDPCV7-A8ux",
        "title": "New RnB 2026 - R&amp;B Playlist - RnB Songs 2026",
          "musicUrl": "https://music.youtube.com/playlist?list=PLHg022HMFzFB7nKvmuvpyGTDPCV7-A8ux",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLHg022HMFzFB7nKvmuvpyGTDPCV7-A8ux"
    },
    "Neo-Soul": {
      "playlistId": "PLxgRj-sFI57ChVko24XjBaHVGmTJNpqiM",
        "title": "Neo-Soul 90&#39;s early 2000&#39;s",
          "musicUrl": "https://music.youtube.com/playlist?list=PLxgRj-sFI57ChVko24XjBaHVGmTJNpqiM",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLxgRj-sFI57ChVko24XjBaHVGmTJNpqiM"
    },
    "90s 2000s R&B": {
      "playlistId": "PLcPsTx18zxlHa_ACeNC_mMirAth-oNz84",
        "title": "RnB 90s-00s - Old School RnB",
          "musicUrl": "https://music.youtube.com/playlist?list=PLcPsTx18zxlHa_ACeNC_mMirAth-oNz84",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLcPsTx18zxlHa_ACeNC_mMirAth-oNz84"
    },
    "Grime UK Drill": {
      "playlistId": "PL8A3BqBeMvue3S4b9buMNh1_blEBpI8_A",
        "title": "Hardest UK Drill Music 2024",
          "musicUrl": "https://music.youtube.com/playlist?list=PL8A3BqBeMvue3S4b9buMNh1_blEBpI8_A",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL8A3BqBeMvue3S4b9buMNh1_blEBpI8_A"
    },
    "Conscious Rap": {
      "playlistId": "PLFW906LqytS9txkGGZhqAzlaRYFaTSUfb",
        "title": "Conscious Rap",
          "musicUrl": "https://music.youtube.com/playlist?list=PLFW906LqytS9txkGGZhqAzlaRYFaTSUfb",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLFW906LqytS9txkGGZhqAzlaRYFaTSUfb"
    },
    "Traditional Swing Jazz": {
      "playlistId": "PLF4noIcOSXnvuluLjMOCElbMUXTIzXxqc",
        "title": "The Best Swing Songs of All Time",
          "musicUrl": "https://music.youtube.com/playlist?list=PLF4noIcOSXnvuluLjMOCElbMUXTIzXxqc",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLF4noIcOSXnvuluLjMOCElbMUXTIzXxqc"
    },
    "Bossa Nova": {
      "playlistId": "PLFCKY2xPd4VXmMGs8cg5lBhc6sz3wLm1a",
        "title": "Bossa Nova Classics",
          "musicUrl": "https://music.youtube.com/playlist?list=PLFCKY2xPd4VXmMGs8cg5lBhc6sz3wLm1a",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLFCKY2xPd4VXmMGs8cg5lBhc6sz3wLm1a"
    },
    "Fusion Jazz": {
      "playlistId": "PLle7_Qoyh5w1kItfdLfHyOUfUdTdWBY01",
        "title": "Fusion jazz South Africa",
          "musicUrl": "https://music.youtube.com/playlist?list=PLle7_Qoyh5w1kItfdLfHyOUfUdTdWBY01",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLle7_Qoyh5w1kItfdLfHyOUfUdTdWBY01"
    },
    "Delta Chicago Blues": {
      "playlistId": "PLp31bdWe7pFBcM-Hi9182dslJhbxPNEw6",
        "title": "Chicago Blues Slow Blues Guitar &amp; Smooth Jazz for Late Night Relaxation",
          "musicUrl": "https://music.youtube.com/playlist?list=PLp31bdWe7pFBcM-Hi9182dslJhbxPNEw6",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLp31bdWe7pFBcM-Hi9182dslJhbxPNEw6"
    },
    "Gospel": {
      "playlistId": "PLmGouTBbived7Cy0F795kR2c_GEfa-Z-T",
        "title": "Playlist Gospel Songs",
          "musicUrl": "https://music.youtube.com/playlist?list=PLmGouTBbived7Cy0F795kR2c_GEfa-Z-T",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLmGouTBbived7Cy0F795kR2c_GEfa-Z-T"
    },
    "Motown Classic Soul": {
      "playlistId": "PL8Lpw39GxwbMmEubwes0T21sqGFyaN7JN",
        "title": "Motown &amp; Soul Playlist HQ",
          "musicUrl": "https://music.youtube.com/playlist?list=PL8Lpw39GxwbMmEubwes0T21sqGFyaN7JN",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL8Lpw39GxwbMmEubwes0T21sqGFyaN7JN"
    },
    "Funk": {
      "playlistId": "PLGBKsNyGY-afVCvIkhgvIvz6nOaL7WfLh",
        "title": "New Funk Songs 2026 - Latest Funk Music 2026 Playlist (New Released Funk Mix 2026-2027)",
          "musicUrl": "https://music.youtube.com/playlist?list=PLGBKsNyGY-afVCvIkhgvIvz6nOaL7WfLh",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLGBKsNyGY-afVCvIkhgvIvz6nOaL7WfLh"
    },
    "Traditional Country": {
      "playlistId": "PL3oW2tjiIxvQW6c-4Iry8Bpp3QId40S5S",
        "title": "Best Country Songs of All Time - Top Country Music Videos",
          "musicUrl": "https://music.youtube.com/playlist?list=PL3oW2tjiIxvQW6c-4Iry8Bpp3QId40S5S",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL3oW2tjiIxvQW6c-4Iry8Bpp3QId40S5S"
    },
    "Modern Pop Country": {
      "playlistId": "PLN_YZjgdIDCfYxxFZW4TFKiFNraH6d9hK",
        "title": "Country Music Playlist 2018-2026: Best Country Songs",
          "musicUrl": "https://music.youtube.com/playlist?list=PLN_YZjgdIDCfYxxFZW4TFKiFNraH6d9hK",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLN_YZjgdIDCfYxxFZW4TFKiFNraH6d9hK"
    },
    "Bluegrass": {
      "playlistId": "PLKUA473MWUv2mddNMPh-MJkgTR5AjTpl3",
        "title": "Best Bluegrass Songs of All Time (Bluegrass Music Playlist Updated in 2026)",
          "musicUrl": "https://music.youtube.com/playlist?list=PLKUA473MWUv2mddNMPh-MJkgTR5AjTpl3",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLKUA473MWUv2mddNMPh-MJkgTR5AjTpl3"
    },
    "Americana": {
      "playlistId": "PLLy1F0NPv5gqf2pGqghLc7YS2zDFOae4u",
        "title": "The Offspring - Americana (Full Album)",
          "musicUrl": "https://music.youtube.com/playlist?list=PLLy1F0NPv5gqf2pGqghLc7YS2zDFOae4u",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLLy1F0NPv5gqf2pGqghLc7YS2zDFOae4u"
    },
    "Contemporary Folk": {
      "playlistId": "PLgny6od8NsR7thUvqvnlaYy6tr02SIeCy",
        "title": "Modern Folk Songs",
          "musicUrl": "https://music.youtube.com/playlist?list=PLgny6od8NsR7thUvqvnlaYy6tr02SIeCy",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLgny6od8NsR7thUvqvnlaYy6tr02SIeCy"
    },
    "Celtic Folk": {
      "playlistId": "PLAt-IVDC3ws3c8kb__ttmqQ2nXiKQUWom",
        "title": "Irish Folk &amp; Celtic Music ~ Full Albums",
          "musicUrl": "https://music.youtube.com/playlist?list=PLAt-IVDC3ws3c8kb__ttmqQ2nXiKQUWom",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLAt-IVDC3ws3c8kb__ttmqQ2nXiKQUWom"
    },
    "Baroque Classical Era": {
      "playlistId": "PLcGkkXtask_clYSk4gXUAjfpquAo_lE9W",
        "title": "Baroque Music | HalidonMusic",
          "musicUrl": "https://music.youtube.com/playlist?list=PLcGkkXtask_clYSk4gXUAjfpquAo_lE9W",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLcGkkXtask_clYSk4gXUAjfpquAo_lE9W"
    },
    "Romantic Era Classical": {
      "playlistId": "PLZSHe_0xk6Mg0Oz8CYswTvHwZ0JrLG-KC",
        "title": "Romantic Era Classical Music",
          "musicUrl": "https://music.youtube.com/playlist?list=PLZSHe_0xk6Mg0Oz8CYswTvHwZ0JrLG-KC",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLZSHe_0xk6Mg0Oz8CYswTvHwZ0JrLG-KC"
    },
    "Modern Classical Minimalist": {
      "playlistId": "PLjFCzsczxKCUlAyY9Al_cgWrcKQSTlWnu",
        "title": "Minimalist Classical Composers",
          "musicUrl": "https://music.youtube.com/playlist?list=PLjFCzsczxKCUlAyY9Al_cgWrcKQSTlWnu",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLjFCzsczxKCUlAyY9Al_cgWrcKQSTlWnu"
    },
    "Cinematic Film Score": {
      "playlistId": "PL4BrNFx1j7E5qDxSPIkeXgBqX0J7WaB2a",
        "title": "The Ultimate Movie Score Playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PL4BrNFx1j7E5qDxSPIkeXgBqX0J7WaB2a",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL4BrNFx1j7E5qDxSPIkeXgBqX0J7WaB2a"
    },
    "Ambient Instrumental": {
      "playlistId": "PL290F940EDA519EB6",
        "title": "The Best Ambient Playlist Ever",
          "musicUrl": "https://music.youtube.com/playlist?list=PL290F940EDA519EB6",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL290F940EDA519EB6"
    },
    "Opera": {
      "playlistId": "PLOwSo8kHs4XT4Hx7OufxbXJLestNUWg7F",
        "title": "Best Opera Songs of All Time - Famous Opera Songs",
          "musicUrl": "https://music.youtube.com/playlist?list=PLOwSo8kHs4XT4Hx7OufxbXJLestNUWg7F",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLOwSo8kHs4XT4Hx7OufxbXJLestNUWg7F"
    },
    "Afrobeats": {
      "playlistId": "PLm90DCMQmtlmGhRX5MuLBafqpq3cvUHWz",
        "title": "Afrobeats Hits",
          "musicUrl": "https://music.youtube.com/playlist?list=PLm90DCMQmtlmGhRX5MuLBafqpq3cvUHWz",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLm90DCMQmtlmGhRX5MuLBafqpq3cvUHWz"
    },
    "Reggae Dancehall": {
      "playlistId": "PLnna6JHCnZnyUEyt4eVt3-DaDboYXCALa",
        "title": "Old school dancehall mix 2018",
          "musicUrl": "https://music.youtube.com/playlist?list=PLnna6JHCnZnyUEyt4eVt3-DaDboYXCALa",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLnna6JHCnZnyUEyt4eVt3-DaDboYXCALa"
    },
    "Salsa Bachata Merengue": {
      "playlistId": "PLWQLazBs82Gg6-VUJC6QUhY0crkjaxWWZ",
        "title": "Bachata, Merengue y Salsa",
          "musicUrl": "https://music.youtube.com/playlist?list=PLWQLazBs82Gg6-VUJC6QUhY0crkjaxWWZ",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLWQLazBs82Gg6-VUJC6QUhY0crkjaxWWZ"
    },
    "Reggaeton Latin Trap": {
      "playlistId": "PLa5wFgN-_u1sAhWOfzQ4pyL1pvpQ4KKvb",
        "title": "Mix Reggaeton &amp; Trap",
          "musicUrl": "https://music.youtube.com/playlist?list=PLa5wFgN-_u1sAhWOfzQ4pyL1pvpQ4KKvb",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLa5wFgN-_u1sAhWOfzQ4pyL1pvpQ4KKvb"
    },
    "K-Pop J-Pop": {
      "playlistId": "PLaodxkj-4NkSJ3vCfuFytfP29lgH3Eb1S",
        "title": "Best J-pop/Anime Songs Playlist 2025",
          "musicUrl": "https://music.youtube.com/playlist?list=PLaodxkj-4NkSJ3vCfuFytfP29lgH3Eb1S",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLaodxkj-4NkSJ3vCfuFytfP29lgH3Eb1S"
    },
    "Flamenco": {
      "playlistId": "PL4jrh8b84UikGEdBZdsetJv5xC0P2wkDT",
        "title": "MEJORES CANCIONES DE FLAMENCO DE LA HISTORIA🙌",
          "musicUrl": "https://music.youtube.com/playlist?list=PL4jrh8b84UikGEdBZdsetJv5xC0P2wkDT",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL4jrh8b84UikGEdBZdsetJv5xC0P2wkDT"
    },
    "Celtic Irish Traditional": {
      "playlistId": "PL6WWUJzS8jrWDedoV3bKEysrPpIbdfJGf",
        "title": "Irish Music | Celtic Music",
          "musicUrl": "https://music.youtube.com/playlist?list=PL6WWUJzS8jrWDedoV3bKEysrPpIbdfJGf",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL6WWUJzS8jrWDedoV3bKEysrPpIbdfJGf"
    },
    "Mainstream Top 40": {
      "playlistId": "PLO7-VO1D0_6No4YpDVJxBT5wMkbHX_MuG",
        "title": "Top 40 Songs This Week - Top 40 2026 - US Top 40 Songs This Week",
          "musicUrl": "https://music.youtube.com/playlist?list=PLO7-VO1D0_6No4YpDVJxBT5wMkbHX_MuG",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLO7-VO1D0_6No4YpDVJxBT5wMkbHX_MuG"
    },
    "Synth-Pop": {
      "playlistId": "PLEXox2R2RxZKyTTlt3kxvtJbI_Cw1K1IX",
        "title": "Top 500 Greatest Synthpop Songs",
          "musicUrl": "https://music.youtube.com/playlist?list=PLEXox2R2RxZKyTTlt3kxvtJbI_Cw1K1IX",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLEXox2R2RxZKyTTlt3kxvtJbI_Cw1K1IX"
    },
    "Indie Pop": {
      "playlistId": "PL1gfuz7ZYcaM2Z7sCGOWORCF0CGmonzOv",
        "title": "Indie India Spotify Playlist - Best Indie Artists India (Hindi Indie Music Playlist 2026)",
          "musicUrl": "https://music.youtube.com/playlist?list=PL1gfuz7ZYcaM2Z7sCGOWORCF0CGmonzOv",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL1gfuz7ZYcaM2Z7sCGOWORCF0CGmonzOv"
    },
    "Dance-Pop": {
      "playlistId": "PLesm76O8GFZOpPPwQtFA5X5Q-Q694_DNU",
        "title": "Vevo 2026 DANCE - POP Hits US 2026 - Top EDM Videos 2026 - New Pop Songs 2026",
          "musicUrl": "https://music.youtube.com/playlist?list=PLesm76O8GFZOpPPwQtFA5X5Q-Q694_DNU",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLesm76O8GFZOpPPwQtFA5X5Q-Q694_DNU"
    },
    "Art Pop": {
      "playlistId": "PLWqkuSwyIh0-J3DMjQaW8ACcrozYKsx08",
        "title": "[Genre]: Art Pop",
          "musicUrl": "https://music.youtube.com/playlist?list=PLWqkuSwyIh0-J3DMjQaW8ACcrozYKsx08",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLWqkuSwyIh0-J3DMjQaW8ACcrozYKsx08"
    },
    "Ska": {
      "playlistId": "PLcM4ZwI542CpvxGYARIo66SU4917w7y7F",
        "title": "British Ska Classics | 1980s | Playlist | Music | UK | 2 Tone | English | The Beat, Specials, Madness, Bad Manners &amp; The Selecter",
          "musicUrl": "https://music.youtube.com/playlist?list=PLcM4ZwI542CpvxGYARIo66SU4917w7y7F",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLcM4ZwI542CpvxGYARIo66SU4917w7y7F"
    },
    "Industrial": {
      "playlistId": "PL_Bfa8M2QionKDqw_k_3fBoTjatIkYSAF",
        "title": "🎧 Industrial Techno Machine ⚙️ | Techno Pulse Official Playlist",
          "musicUrl": "https://music.youtube.com/playlist?list=PL_Bfa8M2QionKDqw_k_3fBoTjatIkYSAF",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL_Bfa8M2QionKDqw_k_3fBoTjatIkYSAF"
    },
    "Noise Experimental": {
      "playlistId": "PLVx6HpgGCDbGspTo7ECzjq6KykGXBmbVn",
        "title": "microsound/glitch/abstract/rhythmic noise/experimental/ambient-techno/dub/minimal",
          "musicUrl": "https://music.youtube.com/playlist?list=PLVx6HpgGCDbGspTo7ECzjq6KykGXBmbVn",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLVx6HpgGCDbGspTo7ECzjq6KykGXBmbVn"
    },
    "Darkwave Goth Rock": {
      "playlistId": "PL_ZjJujLae3zfnAXqWW_eO-ygNEc0FCxs",
        "title": "Post Punk/Goth/Dark Wave/Cold Wave/Synth/Electro/Industrial/Minimal/Dance",
          "musicUrl": "https://music.youtube.com/playlist?list=PL_ZjJujLae3zfnAXqWW_eO-ygNEc0FCxs",
            "verifyUrl": "https://www.youtube.com/playlist?list=PL_ZjJujLae3zfnAXqWW_eO-ygNEc0FCxs"
    },
    "Hyperpop": {
      "playlistId": "PLnDOQeQJN27Bty6fdKf-1u-cqu07DCwvy",
        "title": "Best hyperpop songs",
          "musicUrl": "https://music.youtube.com/playlist?list=PLnDOQeQJN27Bty6fdKf-1u-cqu07DCwvy",
            "verifyUrl": "https://www.youtube.com/playlist?list=PLnDOQeQJN27Bty6fdKf-1u-cqu07DCwvy"
    }
  }
}
*/