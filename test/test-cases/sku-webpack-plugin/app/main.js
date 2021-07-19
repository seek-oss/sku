import 'braid-design-system/reset';
import ReactDom from 'react-dom';
import theme from 'braid-design-system/themes/seekAnz';

import { BraidProvider, Card, Text } from 'braid-design-system';

const App = () => (
  <BraidProvider theme={theme}>
    <Card>
      <Text size="large">Is it working?</Text>
    </Card>
  </BraidProvider>
);

ReactDom.render(
  <App />,
  document.body.appendChild(document.createElement('div')),
);
