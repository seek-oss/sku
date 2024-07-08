import { useState, useEffect } from 'react';
import * as styles from './styles.css.js';
import logo from './logo.png';

export default function App() {
  const [renderLabel, setRenderLabel] = useState('Initial');

  useEffect(() => {
    setRenderLabel('Client');
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.nested}>{renderLabel}</div>
      <img src={logo} />
    </div>
  );
}
