import React from 'react';
import lessStyles from './lessStyles.less';
import jsStyles from './jsStyles.css.js';
import logo from './logo.png';

export default () => (
  <div className={`${lessStyles.root} ${jsStyles.root}`}>
    <div className={`${lessStyles.nested} ${jsStyles.nested}`}>Hello World</div>
    <img src={logo} />
  </div>
);
