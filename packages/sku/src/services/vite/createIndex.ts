import dedent from 'dedent';

export const getOpeningHtml = ({
  headTags,
  rootId = 'root',
  title = 'Sku Project',
}: {
  headTags?: string;
  rootId?: string;
  title?: string;
}) => dedent`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${headTags}
  </head>
  <body>
    <div id="${rootId}">`;

export const getClosingHtml = ({
  bodyTags,
}: {
  bodyTags?: string;
}) => dedent`</div>
${bodyTags}
</body>
</html>`;
