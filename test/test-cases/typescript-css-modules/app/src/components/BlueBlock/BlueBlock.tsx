import styles from './BlueBlock.less';
import React from 'react';

interface BlueBlockProps {
  border?: boolean;
}

export default ({ border = false }: BlueBlockProps) => (
  <div className={`${styles.root} ${border ? styles.border : ''}`} />
);
