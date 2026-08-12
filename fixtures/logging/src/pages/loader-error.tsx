export function loader() {
  throw new Error('Boom from loader');
}

export function Component() {
  return <main>Should not render</main>;
}
