import React, { ReactNode } from 'react';
import lessStyles from './lessStyles.less';
import './globalTypes.d';

enum Message {
  Hello = 'Hello World',
  Goodbye = 'Goodbye World',
}

export const messageRenderer = (): Message => {
  return Message.Hello;
};

interface Props {
  children?: ReactNode;
}

export default ({ children }: Props) => (
  <div className={lessStyles.root}>
    <div className={lessStyles.nested} data-automation-text>
      {children || messageRenderer()}
    </div>
  </div>
);
