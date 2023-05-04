const diffableHtml = require('diffable-html');

const formatHtml = (html) => diffableHtml(html).trim();

module.exports = { formatHtml };
