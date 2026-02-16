import path from 'node:path';
import { defineConfig } from 'vitest/config';

const isWindows = process.platform === 'win32';

export default defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    // Windows requires 'forks' pool — 'threads' causes worker initialization
    // timeouts due to Node.js worker_threads limitations on Windows.
    // Forks with jsdom are heavy (~200MB each), so cap at 4 to avoid
    // "Timeout waiting for worker to respond" errors.
    // See docs/DEVELOPMENT.md for details.
    pool: isWindows ? 'forks' : 'threads',
    maxWorkers: isWindows ? 4 : undefined,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      exclude: [
        '**/__tests__/**',
        '**/test/**',
        '**/*.test.*',
        // Pure types — no runtime code
        'lib/types.ts',
        // API client wrappers — testing only verifies mocked fetch calls
        'lib/api.ts',
        'lib/api/**',
        // Firebase config — environment-dependent initialization
        'lib/firebase.ts',
        // Theme constants — static values only
        'lib/theme.ts',
        'lib/theme/**',
        // Haptic utilities — thin platform-guarded wrappers over expo-haptics
        'lib/haptics.ts',
        // Query provider — singleton QueryClient configuration
        'lib/query-provider.tsx',
        // Barrel re-exports
        'lib/hooks/index.ts',
        // Firebase auth integration — depends on Firebase SDK, Google Sign-In,
        // expo-auth-session; would require mocking the entire auth flow
        'lib/hooks/use-auth.tsx',
        // React Query hooks wrapping API calls — testing only verifies
        // React Query + mock API wiring, not application logic
        'lib/hooks/use-admin.ts',
        // Screen components — heavy UI with logic delegated to hooks
        'app/\\(tabs\\)/**',
        'app/add-recipe.tsx',
        'app/review-recipe.tsx',
        'app/select-recipe.tsx',
        'app/sign-in.tsx',
        'app/recipe/**',
        // Orchestration hooks — compose already-tested hooks/utils with
        // AsyncStorage and React state; testing only verifies mock wiring
        'lib/hooks/useGroceryScreen.ts',
        'lib/hooks/useHomeScreenData.ts',
        'lib/hooks/useMealPlanActions.ts',
        // Root layout — navigation configuration only
        'app/_layout.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 70,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'react-native': path.resolve(__dirname, 'test/mocks/react-native.ts'),
      'expo-linear-gradient': path.resolve(
        __dirname,
        'test/mocks/expo-linear-gradient.ts',
      ),
    },
  },
});
