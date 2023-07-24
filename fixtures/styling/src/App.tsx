import type * as React from 'react';
import { useEffect, useState } from 'react';

import lessStyles from './styles.less';

import BlueBlock from './components/BlueBlock';

const App: React.FC<React.PropsWithChildren> = () => {
  const [renderLabel, setRenderLabel] = useState('Initial');

  useEffect(() => {
    setRenderLabel('Client');
  }, []);

  return (
    <div className={lessStyles.root}>
      <div className={lessStyles.nested} data-automation-text>
        <div>Render type: {renderLabel}</div>
      </div>
      <BlueBlock border />
    </div>
  );
};

export default App;
