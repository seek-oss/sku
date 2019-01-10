import { Stats } from 'webpack';

interface RenderAppProps {
  routeName: string;
  route: string;
  environment: string;
  site: string;
  libraryName: string;
  webpackStats: {
    stats: Stats[];
    hash: string;
  };
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
