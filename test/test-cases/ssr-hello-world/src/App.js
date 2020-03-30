import React from 'react';
import lessStyles from './lessStyles.less';
import logo from './logo.png';

export default () => (
  <div className={lessStyles.root}>
    <div className={lessStyles.nested}>Hello World</div>
    <img src={logo} />
  </div>
);
