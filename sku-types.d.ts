interface RenderAppProps {
  environment: string;
  site: string;
}

interface RenderHTMLProps<T> extends RenderAppProps {
  app: T;
  headTags: string;
  bodyTags: string;
}

export interface Render<T = string> {
  renderApp(p: RenderAppProps): T;

  renderHTML(p: RenderHTMLProps<T>): string;
}
