import styles from './RedBlock.less';

interface RedBlockProps {
  border?: boolean;
}

export default ({ border = false }: RedBlockProps) => (
  <div className={`${styles.root} ${border ? styles.border : ''}`} />
);
