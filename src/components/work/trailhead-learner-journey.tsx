import styles from "./trailhead-learner-journey.module.css";

export function TrailheadLearnerJourney() {
  return (
    <figure className={styles.figure} aria-label="The Trailhead learner journey">
      <div className={styles.diagram}>
        <div className={styles.intro}>Built for the climb. Less useful on the job.</div>
        <ol className={styles.journey} role="list">
          <li className={styles.stage}>
            <div className={styles.context}>On Trailhead</div>
            <div className={styles.track} aria-hidden="true">
              <span className={styles.dot} />
            </div>
            <h3 className={styles.title}>Learning</h3>
            <p className={styles.description}>Build Salesforce skills.</p>
            <div className={styles.detail}>Modules &amp; trails</div>
          </li>
          <li className={`${styles.stage} ${styles.milestone}`}>
            <div className={styles.context}>The turning point</div>
            <div className={styles.track} aria-hidden="true">
              <span className={styles.dot}>✓</span>
            </div>
            <h3 className={styles.title}>Certification</h3>
            <p className={styles.description}>Earn a credential.</p>
            <div className={styles.detail}>
              After the milestone, fewer reasons to return.
            </div>
          </li>
          <li className={`${styles.stage} ${styles.work}`}>
            <div className={styles.context}>Beyond Trailhead</div>
            <div className={styles.track} aria-hidden="true">
              <span className={styles.dot} />
            </div>
            <h3 className={styles.title}>Real-world work</h3>
            <p className={styles.description}>Solve a real problem.</p>
            <div className={styles.tools}>ChatGPT · Slack · YouTube</div>
            <div className={styles.detail}>Where practitioners turn for answers.</div>
          </li>
        </ol>
        <div className={styles.takeaway}>
          Trailhead has a community. The work questions increasingly go elsewhere.
        </div>
      </div>
      <figcaption className={styles.caption}>
        A qualitative journey: the need shifts from earning credentials to solving problems.
      </figcaption>
    </figure>
  );
}
