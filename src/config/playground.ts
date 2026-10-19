export type PlaygroundProject = {
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
  },
  {
    title: "Graphic work for Accredited Educational Activities for Healthcare Professionals",
    video: "/work/playground/cehp vid.mp4",
    poster: "/work/playground/cehp-vid-poster.webp",
    href: "https://cehp-gallery.vercel.app/",
  },
  {
    title: "Coding Terms, Explained",
    video: "/work/playground/game video.mp4",
    poster: "/work/playground/game-video-poster.webp",
    href: "https://techterms.vercel.app/",
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
  },
  {
    title: "Who Made This Song?",
    image: "/work/playground/musictool.png",
    href: "https://produced4.vercel.app/",
  },
];
