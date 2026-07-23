export type ClientContext = {
  fromServer: boolean;
  /** Isomorphic user id projected from middleware via onRequest (not Express `req`). */
  userId: string | null;
};
