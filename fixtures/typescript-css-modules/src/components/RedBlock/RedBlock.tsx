import * as styles from './RedBlock.css.ts';

interface RedBlockProps {
  border?: boolean;
}

export default ({ border = false }: RedBlockProps) => (
  <div className={`${styles.root} ${border ? styles.border : ''}`} />
);
