interface RenderAppProps {
  environment: string;
  site: string;
}

interface renderDocumentProps<T> extends RenderAppProps {
  app: T;
  headTags: string;
  bodyTags: string;
}

export interface Render<T = string> {
  renderApp(p: RenderAppProps): T;

  renderDocument(p: renderDocumentProps<T>): string;
}
