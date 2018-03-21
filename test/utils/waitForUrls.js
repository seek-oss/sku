const { promisify } = require('es6-promisify');
const waitOnAsync = promisify(require('wait-on'));

module.exports = async (...urls) => {
  return await waitOnAsync({
    resources: urls.map(url => url.replace(/^http/, 'http-get')),
    headers: { accept: 'text/html, application/javascript' },
    timeout: 30000
  });
};
