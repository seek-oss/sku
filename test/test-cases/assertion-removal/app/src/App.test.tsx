import { renderToStaticMarkup } from 'react-dom/server';
import App from './App';

describe('App', () => {
  test('assert should throw', () => {
    expect(() => renderToStaticMarkup(<App />)).toThrow(/Should be true/);
  });
});
