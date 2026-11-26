// This needs to be in a separate file to avoid clashing `invariant` variables
import { invariant } from 'outvariant';

export const checkOutvariant = () => {
  invariant(false, 'Should be true');
};
