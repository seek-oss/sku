import { VocabProvider } from '@vocab/react';
import type { ComponentType, ReactNode } from 'react';

export type ClientContext = {
  fromServer: boolean;
};

export const AppProviders = ({
  children,
  language,
}: {
  children: ReactNode;
  language: string;
}) => <VocabProvider language={language ?? 'en'}>{children}</VocabProvider>;

export const createAppWrapper = ({
  language,
}: {
  language: string;
}): ComponentType<{ children: ReactNode }> =>
  function AppWrapper({ children }) {
    return <AppProviders language={language}>{children}</AppProviders>;
  };
