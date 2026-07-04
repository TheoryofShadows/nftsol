/**
 * Drift guard: the backend's local CLOUT_DISTRIBUTION_LIMITS enforcement copy
 * (src/constants/cloutLimits.ts) must stay byte-for-byte equal to the documented
 * single source of truth in shared/constants/fees.ts.
 *
 * The backend keeps a local copy so the production `tsc` build does not reach
 * outside its rootDir. This test ensures the two definitions can never silently
 * diverge — if someone edits one and not the other, CI fails here.
 */
import { CLOUT_DISTRIBUTION_LIMITS as BACKEND_LIMITS } from '../../constants/cloutLimits';
import { CLOUT_DISTRIBUTION_LIMITS as SHARED_LIMITS } from '../../../../../shared/constants/fees';

describe('CLOUT_DISTRIBUTION_LIMITS drift guard', () => {
  it('backend copy matches shared source of truth', () => {
    expect(BACKEND_LIMITS).toEqual(SHARED_LIMITS);
  });
});
