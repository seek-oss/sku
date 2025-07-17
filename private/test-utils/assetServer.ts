import handler from 'serve-handler';
import { createServer } from 'node:http';

// Not exported from `serve-handler` for some reason
type Rewrite = {
  source: string;
  destination: string;
};

export const startAssetServer = async (
  port: number,
  targetDirectory: string,
  rewrites: Rewrite[] = [],
) => {
  const server = createServer((request, response) =>
    handler(request, response, {
      public: targetDirectory,
      // So we can test storybook iframe pages when serving a built storybook
      cleanUrls: ['!/iframe.html'],
      rewrites,
      headers: [
        {
          source: '**/*.*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
          ],
        },
      ],
    }),
  );

  server.listen(port);

  return () => {
    server.close((e) => {
      if (e) {
        console.error('Error closing asset server', e);
      }
    });
  };
};
