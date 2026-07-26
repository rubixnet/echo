export interface LensParams {
  depth: number;
  splay: number;
  feather: number;
  curve: number;
  blur: number;
  chroma: number;
  glint: number;
  tint: number;
  tintColor: string;
}

export type GlassPreset = "simple" | "thick" | "frosted" | "cut" | "plexi";

export const GLASS_PRESETS: Record<GlassPreset, LensParams> = {
  simple: {
    depth: 60,
    splay: 2,
    feather: 24,
    curve: 2,
    blur: 0,
    chroma: 0,
    glint: 25,
    tint: 0,
    tintColor: "#ffffff",
  },
  thick: {
    depth: 120,
    splay: 2,
    feather: 30,
    curve: 3,
    blur: 0,
    chroma: 0.05,
    glint: 60,
    tint: 0,
    tintColor: "#ffffff",
  },
  frosted: {
    depth: 120,
    splay: 16,
    feather: 26,
    curve: 2.6,
    blur: 5,
    chroma: 0,
    glint: 20,
    tint: 0,
    tintColor: "#ffffff",
  },
  cut: {
    depth: 120,
    splay: 40,
    feather: 40,
    curve: 0.6,
    blur: 0.05,
    chroma: 0,
    glint: 15,
    tint: 0,
    tintColor: "#ffffff",
  },
  plexi: {
    depth: 60,
    splay: 4,
    feather: 10,
    curve: 1.2,
    blur: 2.5,
    chroma: 0,
    glint: 25,
    tint: 0.94,
    tintColor: "#ff6600",
  },
};

