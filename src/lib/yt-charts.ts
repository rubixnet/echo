export interface Category {
  id: string;
  name: string;
  playlistId: string;
  coverNode: string;
  type: "chart" | "genre";
}

export const Playlists: Category[] = [
  {
    id: "in-weekly",
    name: "India Top Weekly",
    playlistId: "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI",
    coverNode: "",
    type: "chart",
  },
  {
    id: "global",
    name: "Global Top 50",
    playlistId: "PL4fGSI1pDJn3GzaA6x2tP9oef7O1y0fW1",
    coverNode: "",
    type: "chart",
  },
  {
    id: "us",
    name: "US Top 50",
    playlistId: "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI",
    coverNode: "",
    type: "chart",
  },
  {
    id: "uk",
    name: "UK Top 50",
    playlistId: "PL4fGSI1pDJn2A1iY6y4T_v_A-sR8O7M6k",
    coverNode: "",
    type: "chart",
  },
  {
    id: "in-trending",
    name: "India Trending",
    playlistId: "PL4fGSI1pDJn5kI81J1fY6VMq1BvL-z01w",
    coverNode: "",
    type: "chart",
  },
  {
    id: "pop",
    name: "Pop",
    playlistId: "RDCLAK5uy_kmPRB2yG8L1K8X5l2Z9yP0n29u8y7",
    coverNode: "",
    type: "genre",
  },
  {
    id: "hiphop",
    name: "Hip-Hop & Rap",
    playlistId: "RDCLAK5uy_n9F3R2s89J21m9X_W3Q10O4kRzE0X",
    coverNode: "",
    type: "genre",
  },
  {
    id: "desi-hiphop",
    name: "Desi Hip-Hop",
    playlistId: "RDCLAK5uy_k6L0N7v3u6x1m_p9X8S5W2M_k3X0A",
    coverNode: "",
    type: "genre",
  },
  {
    id: "punjabi",
    name: "Punjabi",
    playlistId: "RDCLAK5uy_m54u9b_8X_N9E6X8T2n1m_p9X8S5W",
    coverNode: "",
    type: "genre",
  },
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    playlistId: "PLWwA0y8p4u4W1x2324m2n21o3p1q4u2o",
    coverNode: "",
    type: "genre",
  },
  {
    id: "electronic",
    name: "Electronic / EDM",
    playlistId: "RDCLAK5uy_k2R8n_m3X0A8S5W2M_k3X0A8S5W2M",
    coverNode: "",
    type: "genre",
  },
  {
    id: "rock",
    name: "Rock Hits",
    playlistId: "RDCLAK5uy_k0n_m3X0A8S5W2M_k3X0A8S5W2M_k",
    coverNode: "",
    type: "genre",
  },
];

export const PLAYLIST_MAP = new Map(Playlists.map((p) => [p.id, p]));
