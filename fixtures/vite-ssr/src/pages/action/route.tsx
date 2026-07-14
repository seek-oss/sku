import { data, Form, useActionData, type RouteObject } from 'react-router';

type ActionResult =
  { type: 'json'; value: unknown } | { type: 'form'; message: string };

export const actionRoute = {
  path: 'action',
  action: async ({ request }) => {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const value = await request.json();
      return data({ type: 'json', value } satisfies ActionResult);
    }

    const formData = await request.formData();
    return data({
      type: 'form',
      message: String(formData.get('message') ?? ''),
    } satisfies ActionResult);
  },
  Component: () => {
    const actionData = useActionData() as ActionResult | undefined;
    let result = 'idle';
    if (actionData?.type === 'json') {
      result = `json:${JSON.stringify(actionData.value)}`;
    } else if (actionData?.type === 'form') {
      result = `form:${actionData.message}`;
    }

    return (
      <main data-testid="action-page">
        <p data-testid="action-result">{result}</p>
        <Form method="post">
          <input name="message" defaultValue="hello" />
          <button type="submit">Submit</button>
        </Form>
      </main>
    );
  },
} satisfies RouteObject;
