import { useQuery } from '@tanstack/react-query';
import { Suspense, useState } from 'react';

const useTodos = () =>
  useQuery({
    suspense: true,
    enabled: true,
    queryKey: ['todos'],
    queryFn: async () => {
      console.log('fetching todos...');
      await new Promise((resolve) => setTimeout(resolve, 10));
      console.log('fetched todos!');
      return [`todo1`, `todo2`, `todo3`];
    },
  });

function TodoList() {
  const { data: todos } = useTodos();
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo}>{todo}</li>
      ))}
    </ul>
  );
}

export default () => {
  const [open, setOpen] = useState(true);

  return (
    <Suspense fallback={<div>loading...</div>}>
      {open ? <TodoList /> : null}
    </Suspense>
  );
};
