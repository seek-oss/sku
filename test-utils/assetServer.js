const handler = require('serve-handler');
const http = require('node:http');

const startAssetServer = async (port, targetDirectory, rewrites = []) =>
  new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      return handler(request, response, {
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
      });
    });

    server.listen(port, () => {
      resolve(() => server.close());
    });
  });

module.exports = { startAssetServer };
