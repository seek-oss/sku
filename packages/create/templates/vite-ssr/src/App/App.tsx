import { NextSteps } from './NextSteps';

const environment =
  import.meta.env.MODE === 'production' ? 'production' : 'development';

export const App = () => <NextSteps environment={environment} />;
