const { Option } = require('commander');
const siteOption = new Option('--site [site]', 'Site to serve on');

module.exports = siteOption;
