import { style } from 'sku/treat';

export const customBox = style(({ color }) => ({
  backgroundColor: color.background.brandAccent,
  color: 'white',
  fontSize: 50,
  padding: 20,
}));
