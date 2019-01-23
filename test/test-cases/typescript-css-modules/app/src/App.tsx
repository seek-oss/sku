import React from 'react';
import lessStyles from './lessStyles.less';
import jsStyles from './jsStyles.css.js';

enum Message {
  Hello = 'Hello World',
  Goodbye = 'Goodbye World'
}

export const messageRenderer = (): Message => {
  return Message.Hello;
};

export default () => (
  <div className={`${lessStyles.root} ${jsStyles.root}`}>
    <div
      className={`${lessStyles.nested} ${jsStyles.nested}`}
      data-automation-text
    >
      {messageRenderer()}
    </div>
  </div>
);
