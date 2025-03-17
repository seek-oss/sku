/* eslint-disable no-console */
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';

const useTodos = () =>
  useQuery({
    suspense: true,
    enabled: true,
    queryKey: ['todos'],
    queryFn: async () => {
      console.log('Loading todos...');
      await new Promise((resolve) => setTimeout(resolve, 10));
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
  return (
    <Suspense fallback={<div>loading...</div>}>
      <TodoList />
    </Suspense>
  );
};
