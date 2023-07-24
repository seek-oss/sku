import '@sku-fixtures/package-with-styles/styles.css';

import * as styles from './BlueBlock.css';

interface BlueBlockProps {
  border?: boolean;
}

export default ({ border = false }: BlueBlockProps) => (
  <div className={`${styles.root} ${border ? styles.border : ''}`} />
);
