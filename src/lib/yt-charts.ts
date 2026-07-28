export interface Category {
  id: string;
  name: string;
  playlistId: string;
}

export const CHARTS: Category[] = [
  { id: "in-weekly", name: "India Top Weekly", playlistId: "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI" },
  { id: "global", name: "Global Top 50", playlistId: "PL4fGSI1pDJn3GzaA6x2tP9oef7O1y0fW1" },
  { id: "us", name: "US Top 50", playlistId: "PL4fGSI1pDJn1z1K3B2K_U-s1xR5yB5J9P" },
  { id: "uk", name: "UK Top 50", playlistId: "PL4fGSI1pDJn2A1iY6y4T_v_A-sR8O7M6k" },
  { id: "in-trending", name: "India Trending", playlistId: "PL4fGSI1pDJn5kI81J1fY6VMq1BvL-z01w" },
];

export const GENRES: Category[] = [
  { id: "pop", name: "Pop", playlistId: "RDCLAK5uy_kmPRB2yG8L1K8X5l2Z9yP0n29u8y7" },
  { id: "hiphop", name: "Hip-Hop & Rap", playlistId: "RDCLAK5uy_n9F3R2s89J21m9X_W3Q10O4kRzE0X" },
  { id: "desi-hiphop", name: "Desi Hip-Hop", playlistId: "RDCLAK5uy_k6L0N7v3u6x1m_p9X8S5W2M_k3X0A" },
  { id: "punjabi", name: "Punjabi", playlistId: "RDCLAK5uy_m54u9b_8X_N9E6X8T2n1m_p9X8S5W" },
  { id: "lofi", name: "Lo-Fi Beats", playlistId: "PLWwA0y8p4u4W1x2324m2n21o3p1q4u2o" },
  { id: "electronic", name: "Electronic / EDM", playlistId: "RDCLAK5uy_k2R8n_m3X0A8S5W2M_k3X0A8S5W2M" },
  { id: "rock", name: "Rock Hits", playlistId: "RDCLAK5uy_k0n_m3X0A8S5W2M_k3X0A8S5W2M_k" },
];