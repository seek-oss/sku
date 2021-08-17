enum Message {
  Hello = 'Hello World',
  Goodbye = 'Goodbye World',
}

export const messageRenderer = (): Message => Message.Hello;

export default () => <div>{messageRenderer()}</div>;
