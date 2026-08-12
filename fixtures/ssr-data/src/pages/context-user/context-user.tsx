import { useLoaderData, type LoaderFunctionArgs } from 'react-router';

import { userIdContext } from '../../userIdContext.js';

export async function loader({ context }: LoaderFunctionArgs) {
  return {
    userId: context.get(userIdContext),
  };
}

export function Component() {
  const { userId } = useLoaderData<typeof loader>();

  return (
    <main data-testid="context-user-page">
      <h1>Context user</h1>
      <p data-testid="context-user-id">{userId ?? 'missing'}</p>
    </main>
  );
}
