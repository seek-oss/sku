// @ts-check
const diffableHtml = require("diffable-html");

/** @param {string} html */
const formatHtml = (html) => diffableHtml(html).trim();

module.exports = { formatHtml };
