import styles from './BlueBlock.less';

interface BlueBlockProps {
  border?: boolean;
}

export default ({ border = false }: BlueBlockProps) => (
  <div className={`${styles.root} ${border ? styles.border : ''}`} />
);
