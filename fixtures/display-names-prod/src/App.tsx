import React from 'react';

interface WithDisplayName<P = {}> extends React.FC<P> {
  displayName?: string;
}

const Button: WithDisplayName = () => <button>Click me</button>;

const Card: WithDisplayName = () => <div>This is a card</div>;

const Header: WithDisplayName<{ title: string }> = ({ title }) => (
  <h1>{title}</h1>
);

const MemoFooter = React.memo(() => <footer>Footer content</footer>);

const Input: WithDisplayName = () => <input />;

export default function App() {
  return (
    <div>
      <Header title="Display Names Test" />
      <Button />
      <Card />
      <Input />
      <MemoFooter />
      <div id="display-names-test">
        <p>Components should have displayName in production build:</p>
        <ul>
          <li>Button.displayName: {Button.displayName || 'undefined'}</li>
          <li>Card.displayName: {Card.displayName || 'undefined'}</li>
          <li>Header.displayName: {Header.displayName || 'undefined'}</li>
          <li>
            MemoFooter.displayName: {MemoFooter.displayName || 'undefined'}
          </li>
          <li>Input.displayName: {Input.displayName || 'undefined'}</li>
        </ul>
      </div>
    </div>
  );
}
