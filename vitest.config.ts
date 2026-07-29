import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    // The specs use bare `it`/`expect`, as they did under Jest.
    globals: true
  }
});
