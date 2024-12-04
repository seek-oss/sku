// @ts-check
import diffableHtml from 'diffable-html';

/** @param {string} html */
export const formatHtml = (html) => diffableHtml(html).trim();
