import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, it, expect } from 'vitest';

describe('good tests', () => {
  it('should be true', () => {
    expect(true).toBe(true);
  });
});

describe('testing-library', () => {
  it('should render a div', () => {
    const { getByText } = render(createElement('div', null, 'Hello World'));

    expect(getByText('Hello World')).toBeInTheDocument();
  });
});
