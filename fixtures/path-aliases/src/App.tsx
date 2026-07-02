import { Button } from '#components/Button';
import { add } from '#src/utils/add';
import * as stylesCssTs from '#styles/root.css.ts';

import { paragraph, paragraph as _paragraph } from '#styles/root.css';
// This does not get picked up by the vanilla-extract css filter since it doesn't have a ts/js extension (e.g., "foo.css.ts")
import * as stylesCss from '#styles/root.css';

// This _does_ get picked up by the vanilla-extract css filter so we need to make sure that it resolves correctly.
// The internal resolve (`this.resolve`) is used in that plugin to make sure it resolves aliases.
/** @knipignore */

export default () => (
  <div>
    <p className={paragraph}>6 + 9 = {add(6, 9)}</p>
    <p className={_paragraph}>relative import styles</p>
    <p className={stylesCss.paragraph}>this text is red</p>
    <p className={stylesCssTs.paragraph}>this text is also red</p>
    <Button />
  </div>
);
