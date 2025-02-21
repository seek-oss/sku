export default ({ site }: { site: string }) => {
  const message = `Welcome to the Home page - ${site}`;
  return <h1>{message}</h1>;
};
