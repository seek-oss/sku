import React from 'react';
import lessStyles from './lessStyles.less';
import jsStyles from './jsStyles.css.js';

export default ({ children }) => (
  <div className={`${lessStyles.root} ${jsStyles.root}`}>
    <div
      className={`${lessStyles.nested} ${jsStyles.nested}`}
      data-automation-text
    >
      {children || 'Hello World'}
    </div>
  </div>
);
