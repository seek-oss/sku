// // import { Transform } from 'node:stream';
// // import { getClosingHtml, getOpeningHtml } from './createIndex.js';
// // import { serializeConfig } from '../serializeConfig.js';
// // Has to be strongly typed once the first entity in renderContext is known.

// type CreatePreRenderedHtmlOptions<App> = {
//   language: string | null;
//   route: NormalizedRoute;
//   render: Render<App>;
//   clientEntry: string;
//   hooks?: {
//     getBodyTags?: () => string;
//     getHeadTags?: () => string;
//   };

// export async function createPreRenderedHtml<App>({
//   render,
//   site,
//   clientEntry,
//   language,
//   route,
// }: CreatePreRenderedHtmlOptions<App>): Promise<string> {

//   // if (render.provideClientContext) {
//   //   // Check what kind of context needs to be passed into this function.
//   //   clientContext = await render.provideClientContext({
//   //     app,
//   //     site,
//   //     url,
//   //   });
//   // }

//   // This can be improved? Thinking of the interface can improve.
//   // We need to use the client generated header for the SSG/SSR rendering so using a html document is not the best way to do it.
//   // That was what .renderDocument was doing.
//   // const renderedBodyTags = render.bodyTags ? await render.bodyTags() : '';
//   // const renderedHeadTags = render.headTags ? await render.headTags() : '';

//   // let html = '';

//   //   const { pipe } = await render.render({
//   //     url,
//   //     site,
//   //     renderContext,
//   //     options: {
//   //       onShellError(error: any) {
//   //         reject(error);
//   //       },
//   //       onError(error: any) {
//   //         console.error(error);
//   //       },
//   //       onAllReady() {
//   //         const extraBodyTags = getBodyTags ? getBodyTags() : '';
//   //         const bodyTags = [
//   //           Object.keys(clientContext).length > 0 &&
//   //             serializeConfig(clientContext),
//   //           renderedBodyTags,
//   //           extraBodyTags,
//   //         ]
//   //           .filter(Boolean)
//   //           .join('\n');

//   //         const extraHeadTags = getHeadTags ? getHeadTags() : '';
//   //         const headTags = [renderedHeadTags, extraHeadTags].join('\n');

//   //         const startHtml = getOpeningHtml({
//   //           title: 'Sku Project',
//   //           headTags,
//   //         });

//   //         html += startHtml;

//   //         const transformStream = new Transform({
//   //           transform(chunk, encoding, callback) {
//   //             html += chunk.toString();
//   //             callback();
//   //           },
//   //         });

//   //         transformStream.on('finish', () => {
//   //           html += getClosingHtml({ bodyTags });
//   //           resolve(html);
//   //         });

//   //         pipe(transformStream);
//   //       },
//   //     },
//   // });
//   // });
// }
