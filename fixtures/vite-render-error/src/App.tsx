import { HomePage } from './HomePage.tsx';

type Props = {
  route: string;
};

export const App = ({ route }: Props) => {
  if (route === '/') {
    return <HomePage />;
  }

  return <div>Page not found</div>;
};
