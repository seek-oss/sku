import { Form } from 'react-router';

export async function action() {
  throw new Error('Boom from action');
}

export function Component() {
  return (
    <main data-testid="action-error-page">
      <h1>Action error</h1>
      <Form method="post">
        <button type="submit" data-testid="action-error-submit">
          Trigger action error
        </button>
      </Form>
    </main>
  );
}
