import { useState } from 'react';

import classes from './ModuleFile.module.css';

const ModuleFile = () => {
  const [state, setState] = useState(0);
  return (
    <div className={classes.testClass} onClick={() => setState(state + 1)}>
      Hello thing! {state}\ test lol
    </div>
  );
};

export default ModuleFile;
