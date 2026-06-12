import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="home-section home-section--hero home-fold" data-smart-navbar-hero id="hero">
      <div className="home-fold__center">
        <Image
          alt="Portrait"
          className="home-fold__portrait"
          height={120}
          src="/assets/profilepic.png"
          width={120}
        />
        <h1 className="home-fold__headline text-display-2 text-text-primary">
          I&apos;m A Product Designer Fascinated By People, And Leverage That To Build Products Worth
          Using.
        </h1>
        <p className="home-fold__subhead text-body-2 text-text-muted">
          Previously owned design for an enterprise FinTech platform used by 100+ companies globally.
          I&apos;m currently open to Product/UX Design opportunities.
        </p>
      </div>

      <p className="home-fold__credibility text-body-2 text-text-muted">
        I work fast, care about tiny details, and have an appetite for things I haven&apos;t tried
        before.
      </p>

      <div className="home-fold__actions">
        <Link className="home-action home-action--secondary text-label-1" href="/about">
          Who am I
        </Link>
        <a className="home-action home-action--primary text-label-1" href="#work">
          <span>See work</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
