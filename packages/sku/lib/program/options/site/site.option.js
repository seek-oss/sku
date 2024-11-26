const { Option } = require('commander');
const siteOption = new Option('-si, --site [site]', 'Site to serve on');

module.exports = siteOption;
