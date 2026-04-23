import { Button } from '@components/Button';
import { add } from 'src/utils/add';

// This does not get picked up by the vanilla-extract css filter since it doesn't have a ts/js extension (e.g., "foo.css.ts")
import * as stylesCss from '#styles/root.css';

// This _does_ get picked up by the vanilla-extract css filter so we need to make sure that it resolves correctly.
// The internal resolve (`this.resolve`) is used in that plugin to make sure it resolves aliases.
import * as stylesCssTs from '#styles/root.css.ts';

export default () => (
  <div>
    <p className={stylesCss.paragraph}>6 + 9 = {add(6, 9)}</p>
    <p className={stylesCssTs.paragraph}>this text is red</p>
    <Button />
  </div>
);
