import React from 'react';
import lessStyles from './lessStyles.less';
import jsStyles from './jsStyles.css.js';

export default ({ children }) => {
  const [message, setMessage] = React.useState('Initial render');

  // This tests that React has boostrapped correctky client side
  setTimeout(() => {
    setMessage('Updated render');
  }, 1);

  return (
    <div className={`${lessStyles.root} ${jsStyles.root}`}>
      <div
        className={`${lessStyles.nested} ${jsStyles.nested}`}
        data-automation-text
      >
        {children || message}
      </div>
    </div>
  );
};
