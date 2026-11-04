import styles from "./trailhead-opening-context.module.css";

const roles = ["ResearchOps lead", "Product strategy", "Chatbot prototyping"] as const;

export function TrailheadOpeningContext() {
  return (
    <div className={styles.root}>
      <dl className={styles.details}>
        <div className={styles.group}>
          <dt className={styles.label}>My role</dt>
          {roles.map((role) => (
            <dd className={styles.value} key={role}>
              {role}
            </dd>
          ))}
        </div>
        <div className={styles.group}>
          <dt className={styles.label}>Timeline</dt>
          <dd className={styles.value}>10 months</dd>
        </div>
        <div className={styles.group}>
          <dt className={styles.label}>Team</dt>
          <dd className={styles.value}>Five-person capstone team</dd>
        </div>
      </dl>

      <section className={styles.overview} aria-labelledby="trailhead-preview-overview">
        <p className={styles.sectionLabel} id="trailhead-preview-overview">
          Overview
        </p>
        <div className={styles.stories}>
          <div className={styles.story}>
            <h2 className={styles.statement}>
              Trailhead helps people build Salesforce skills and earn certifications for their careers.
            </h2>
            <p className={styles.support}>
              Salesforce’s learning platform offers guided learning paths, hands-on practice, and
              certifications to help people prepare for roles in its ecosystem.
            </p>
            <div className={styles.placeholder}>
              <p className={styles.placeholderLabel}>
                Trailhead learning paths, badges, and certifications
              </p>
            </div>
          </div>

          <div className={styles.story}>
            <h2 className={styles.statement}>
              But after certification, experienced users were disengaging.
            </h2>
            <p className={styles.support}>
              Our challenge was to give experienced users a reason to keep returning to Trailhead
              beyond their next certification.
            </p>
            <figure className={styles.figure}>
              <div className={`${styles.placeholder} ${styles.placeholderJourney}`}>
                <p className={styles.placeholderLabel}>
                  Learner journey: learning → certification → disengagement
                </p>
              </div>
              <figcaption className={styles.caption}>
                Illustrative journey showing the challenge after certification.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <hr className={styles.divider} />
    </div>
  );
}
