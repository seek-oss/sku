import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const query = gql`
  {
    foo
  }
`;

export default () => {
  const _result = useQuery(query, { skip: true });

  return <div>Vite CJS Interop - Apollo Client v4</div>;
};
