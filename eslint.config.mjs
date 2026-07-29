import {getPresets} from 'eslint-config-molindo';

export default [
  ...(await getPresets('typescript', 'vitest')),
  {
    rules: {
      'no-prototype-builtins': 'off',

      // This package walks GraphQL documents supplied by callers. The AST types
      // describe them as fully populated, so these rules flag the defensive
      // guards around malformed input as redundant. The guards are deliberate,
      // and `no-unnecessary-condition` additionally needs `strictNullChecks`,
      // which this project does not enable yet.
      '@typescript-eslint/no-unnecessary-condition': 'off'
    }
  }
];
