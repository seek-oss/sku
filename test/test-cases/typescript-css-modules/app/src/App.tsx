import React from 'react';
import lessStyles from './lessStyles.less';
import jsStyles from './jsStyles.css.js';

export const messageRenderer = (): string => {
  return 'Hello World';
};

export default () => (
  <div className={`${lessStyles.root} ${jsStyles.root}`}>
    <div className={`${lessStyles.nested} ${jsStyles.nested}`}>
      {messageRenderer()}
    </div>
  </div>
);
