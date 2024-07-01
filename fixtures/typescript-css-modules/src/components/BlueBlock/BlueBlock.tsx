import * as styles from './BlueBlock.css.ts';

interface BlueBlockProps {
  border?: boolean;
}

export default ({ border = false }: BlueBlockProps) => (
  <div className={`${styles.root} ${border ? styles.border : ''}`} />
);
