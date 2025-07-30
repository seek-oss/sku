import React from 'react';

const Button = () => <button>Click me</button>;

const Card = () => {
  return <div>This is a card</div>;
};

const Header = ({ title }: { title: string }) => <h1>{title}</h1>;

const MemoizedFooter = React.memo(() => <footer>Footer content</footer>);

const Input = React.forwardRef<HTMLInputElement, { placeholder?: string }>(
  ({ placeholder }, ref) => <input ref={ref} placeholder={placeholder} />,
);

export default function App() {
  return (
    <div>
      <Header title="Display Names Test" />
      <Button />
      <Card />
      <Input placeholder="Test input" />
      <MemoizedFooter />
      <div id="display-names-test">
        <p>Components should have displayName in production build:</p>
        <ul>
          <li>
            Button.displayName: {(Button as any).displayName || 'undefined'}
          </li>
          <li>Card.displayName: {(Card as any).displayName || 'undefined'}</li>
          <li>
            Header.displayName: {(Header as any).displayName || 'undefined'}
          </li>
          <li>
            MemoizedFooter.displayName:{' '}
            {(MemoizedFooter as any).displayName || 'undefined'}
          </li>
          <li>
            Input.displayName: {(Input as any).displayName || 'undefined'}
          </li>
        </ul>
      </div>
    </div>
  );
}
