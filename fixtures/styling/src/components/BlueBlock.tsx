import '@sku-fixtures/package-with-styles/styles.css';

import * as styles from './BlueBlock.css';
import lessStyles from './styles.less';

interface BlueBlockProps {
  border?: boolean;
}

export default ({ border = false }: BlueBlockProps) => (
  <div className={lessStyles.root}>
    <span className="external" data-automation-external>
      This should be invisible
    </span>
    <div className={lessStyles.nested} data-automation-less />
    <div
      className={`${styles.root} ${border ? styles.border : ''}`}
      data-automation-vanilla
    />
  </div>
);
