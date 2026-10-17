export type PlaygroundProject = {
  href?: string;
  image?: string;
  title: string;
  video?: string;
};

export const PLAYGROUND_PROJECTS: PlaygroundProject[] = [
  {
    title: "Showcasing some of my favorite albums of all time",
    video: "/work/playground/albumshowcase.mp4",
    href: "https://albumshowcase.vercel.app/",
  },
  {
    title: "Graphic work for Accredited Educational Activities for Healthcare Professionals",
    video: "/work/playground/cehp vid.mp4",
    href: "https://cehp-gallery.vercel.app/",
  },
  {
    title: "A fun way to learn coding terms for vibe-coders",
    video: "/work/playground/game video.mp4",
    href: "https://techterms.vercel.app/",
  },
  {
    title: "Automated email summaries using n8n",
    video: "/work/playground/n8n vid.mp4",
  },
  {
    title: "One of my final projects as an audio engineer for a feature film",
    image: "/work/playground/cet.jpg",
    href: "https://youtu.be/55Q-Wp7MGsI?si=c4tn7xZjhMrlm8K5",
  },
  {
    title: "Music credit lookup tool, inspired by my time as a musician and audio engineer",
    image: "/work/playground/musictool.png",
    href: "https://produced4.vercel.app/",
  },
];
