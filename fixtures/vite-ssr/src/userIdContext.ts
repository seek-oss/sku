import { createContext as createRouterContext } from 'react-router';

/** Projected user id for loader DI — never put Express `req` in this provider. */
export const userIdContext = createRouterContext<string | null>(null);
