export const PLAYGROUND_COMING_SOON_LABEL = "Coming soon!";

export type PlaygroundProject = {
  comingSoon?: boolean;
  /** Home work grid uses the full-width case-study card instead of the compact grid. */
  featured?: boolean;
  /** Kept in config for a later page. Omitted from the homepage work grid. */
  hiddenFromHome?: boolean;
  href?: string;
  image?: string;
  poster?: string;
  title: string;
  typeLabel?: string;
  video?: string;
};

export const PLAYGROUND_PROJECTS: PlaygroundProject[] = [
  {
    title: "My Favorite Albums",
    video: "/work/playground/albumshowcase.mp4",
    poster: "/work/playground/albumshowcase-poster.webp",
    href: "https://albumshowcase.vercel.app/",
    typeLabel: "Play",
    featured: true,
  },
  {
    title: "Graphic work for Accredited Educational Activities for Healthcare Professionals",
    video: "/work/playground/cehp vid.mp4",
    poster: "/work/playground/cehp-vid-poster.webp",
    href: "https://cehp-gallery.vercel.app/",
    typeLabel: "Play",
    featured: true,
  },
  {
    title: "Coding Terms for Vibe-Coders",
    video: "/work/playground/game video.mp4",
    poster: "/work/playground/game-video-poster.webp",
    typeLabel: "Play",
    comingSoon: true,
  },
  {
    title: "Automated Email Summaries with n8n",
    video: "/work/playground/n8n vid.mp4",
    poster: "/work/playground/n8n-vid-poster.webp",
    typeLabel: "Play",
  },
  {
    title: "One of my final projects as an audio engineer for a feature film",
    image: "/work/playground/cet.jpg",
    href: "https://youtu.be/55Q-Wp7MGsI?si=c4tn7xZjhMrlm8K5",
    typeLabel: "Play",
    hiddenFromHome: true,
  },
  {
    title: "Who Made This Song?",
    image: "/work/playground/musictool.png",
    typeLabel: "Play",
    comingSoon: true,
  },
];
