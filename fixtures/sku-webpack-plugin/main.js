import 'braid-design-system/reset';
import { createRoot } from 'react-dom/client';
import theme from 'braid-design-system/themes/seekJobs';

import { BraidProvider, Card, Text } from 'braid-design-system';

const App = () => (
  <BraidProvider theme={theme}>
    <Card>
      <Text size="large">Is it working?</Text>
    </Card>
  </BraidProvider>
);

const root = createRoot(
  document.body.appendChild(document.createElement('div')),
);

root.render(<App />);
