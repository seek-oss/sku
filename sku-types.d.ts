import { Stats } from 'webpack';
import { ComponentType } from 'react';

interface RenderAppProps {
  routeName: string;
  route: string;
  environment: string;
  site: string;
  libraryName: string;
  SkuProvider: ComponentType;
  // Webpack use an any here. PR for better type welcome.
  webpackStats: object;
}

interface RenderDocumentProps<T> extends RenderAppProps {
  app: T;
  headTags: string;
  bodyTags: string;
}

export interface Render<T = string> {
  renderApp(p: RenderAppProps): T;

  renderDocument(p: RenderDocumentProps<T>): string;
}
