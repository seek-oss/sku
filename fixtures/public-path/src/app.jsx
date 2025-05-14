import * as styles from './app.css.js';
import avif from './large-image.avif';

export default () => (
  <>
    <div className={styles.avif} />
    <img src={avif} />
    <div className={styles.bmp} />
    <div className={styles.gif} />
    <div className={styles.jpg} />
    <div className={styles.png} />
    <div className={styles.webp} />
  </>
);
