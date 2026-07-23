import { createContext } from 'react';
import { createContext as createRouterContext } from 'react-router';

/** Projected user id for loader DI — never put Express `req` in this provider. */
export const userIdContext = createRouterContext<string | null>(null);

/** React provider for middleware-projected user id (AppWrapper DI). */
export const SkuUserIdReactContext = createContext<string | null>(null);
