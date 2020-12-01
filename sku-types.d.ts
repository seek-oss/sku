import { ComponentType } from 'react';

interface SharedRenderProps {
  routeName: string;
  route: string;
  environment: string;
  site: string;
  language: string;
  libraryName: string;
  // Webpack use an any here. PR for better type welcome.
  webpackStats: any;
}

interface RenderAppProps extends SharedRenderProps {
  SkuProvider: ComponentType;
  _addChunk: (chunkName: string) => void;
}

interface RenderDocumentProps<App> extends SharedRenderProps {
  app: App;
  headTags: string;
  bodyTags: string;
}

export interface Render<App = string> {
  renderApp(p: RenderAppProps): Promise<App> | App;

  provideClientContext?(p: {
    environment: string;
    site: string;
    app: App;
  }): Promise<any> | any;

  renderDocument(p: RenderDocumentProps<App>): Promise<string> | string;
}
