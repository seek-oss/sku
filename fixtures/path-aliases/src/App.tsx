import { Button } from '@components/Button';
import { add } from 'src/utils/add';

export default () => (
  <div>
    <p>6 + 9 = {add(6, 9)}</p>
    <Button />
  </div>
);
