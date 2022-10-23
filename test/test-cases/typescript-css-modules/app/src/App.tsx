import React, { ReactNode, useEffect, useState } from 'react';
import lessStyles from './lessStyles.less';
import './globalTypes.d';

enum Message {
  Hello = 'Hello World',
  Goodbye = 'Goodbye World',
}

const messageRenderer = (): Message => Message.Hello;

interface Props {
  children?: ReactNode;
}

// This is a test for ensuring typescript-specific keywords are stripped out
// by babel during transpilation, in this case the `protected` keyword
export class MyClass {
  constructor(protected foo: number) {}
}

const App = ({ children }: Props) => {
  const [renderLabel, setRenderLabel] = useState('Initial');

  useEffect(() => {
    setRenderLabel('Client');
  }, []);

  return (
    <div className={lessStyles.root}>
      <div className={lessStyles.nested} data-automation-text>
        {children || messageRenderer()}
      </div>
      <div>Render type: {renderLabel}</div>
    </div>
  );
};

export default App;
