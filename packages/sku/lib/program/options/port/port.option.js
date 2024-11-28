const { Option } = require('commander');
const portOption = new Option('--port [port]', 'Port to serve on');

module.exports = portOption;
