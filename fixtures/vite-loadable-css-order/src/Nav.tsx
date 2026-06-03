import { Inline, Text } from 'braid-design-system';
import { Link } from 'react-router';

export const Nav = () => (
  <Inline space="medium">
    <Text>
      <Link to="/">home</Link>
    </Text>
    <Text>
      <Link to="/details/1">details 1</Link>
    </Text>
  </Inline>
);
