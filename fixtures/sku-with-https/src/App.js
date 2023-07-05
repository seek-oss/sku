import { useState, useEffect } from 'react';
import lessStyles from './lessStyles.less';
import logo from './logo.png';

export default function App() {
  const [renderLabel, setRenderLabel] = useState('Initial');

  useEffect(() => {
    setRenderLabel('Client');
  }, []);

  return (
    <div className={lessStyles.root}>
      <div className={lessStyles.nested}>{renderLabel}</div>
      <img src={logo} />
    </div>
  );
}
