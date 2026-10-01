export interface DemoSong {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
}

export const DEMO_SONGS: DemoSong[] = [
  {
    id: "demo-bassline-bounce",
    title: "Bassline Bounce",
    artist: "Echo Studio",
    duration: "0:18",
    coverUrl: "/audio/demo/covers/bassline-bounce.png",
  },
  {
    id: "demo-coffee-shop-keys",
    title: "Coffee Shop Keys",
    artist: "Echo Studio",
    duration: "0:25",
    coverUrl: "/audio/demo/covers/coffee-shop-keys.png",
  },
  {
    id: "demo-deep-focus",
    title: "Deep Focus",
    artist: "Echo Studio",
    duration: "0:21",
    coverUrl: "/audio/demo/covers/deep-focus.png",
  },
  {
    id: "demo-echo-chamber",
    title: "Echo Chamber",
    artist: "Echo Studio",
    duration: "0:23",
    coverUrl: "/audio/demo/covers/echo-chamber.png",
  },
  {
    id: "demo-midnight-loop",
    title: "Midnight Loop",
    artist: "Echo Studio",
    duration: "0:19",
    coverUrl: "/audio/demo/covers/midnight-loop.png",
  },
  {
    id: "demo-neon-drive",
    title: "Neon Drive",
    artist: "Echo Studio",
    duration: "0:16",
    coverUrl: "/audio/demo/covers/neon-drive.png",
  },
  {
    id: "demo-rainy-window",
    title: "Rainy Window",
    artist: "Echo Studio",
    duration: "0:28",
    coverUrl: "/audio/demo/covers/rainy-window.png",
  },
  {
    id: "demo-sunrise-chords",
    title: "Sunrise Chords",
    artist: "Echo Studio",
    duration: "0:17",
    coverUrl: "/audio/demo/covers/sunrise-chords.png",
  },
];