import '@sku-fixtures/package-with-styles/styles.css';

import * as styles from './BlueBlock.css';

interface BlueBlockProps {
  border?: boolean;
}

export default ({ border = false }: BlueBlockProps) => (
  <div>
    <span className="external" data-automation-external>
      This should be invisible
    </span>
    <div
      className={`${styles.root} ${border ? styles.border : ''}`}
      data-automation-vanilla
    />
  </div>
);
