import type * as React from 'react';
import { useEffect, useState } from 'react';

import BlueBlock from './components/BlueBlock';

const App: React.FC<React.PropsWithChildren> = () => {
  const [renderLabel, setRenderLabel] = useState('Initial');

  useEffect(() => {
    setRenderLabel('Client');
  }, []);

  return (
    <div>
      <div>Render type: {renderLabel}</div>
      <BlueBlock border />
    </div>
  );
};

export default App;
