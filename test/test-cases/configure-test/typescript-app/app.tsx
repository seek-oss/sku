import React from 'react';

enum Message {
  Hello = 'Hello World',
  Goodbye = 'Goodbye World'
}

export const messageRenderer = (): Message => {
  return Message.Hello;
};

export default () => <div>{messageRenderer()}</div>;
