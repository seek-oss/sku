export const routes = {
  home: { path: '/' },
  details: { path: '/details/:id' },
};

export type RouteName = keyof typeof routes;
