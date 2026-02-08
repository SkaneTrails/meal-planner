import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    pool: 'threads',
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
        // HTTP wrapper — testing mocked fetch calls is pointless
        'lib/api.ts',
        // Firebase config — environment-dependent initialization
        'lib/firebase.ts',
        // Theme constants — static values only
        'lib/theme.ts',
        // Haptic utilities — thin platform-guarded wrappers over expo-haptics
        'lib/haptics.ts',
        // Query provider — singleton QueryClient configuration
        'lib/query-provider.tsx',
        // Barrel re-exports
        'lib/hooks/index.ts',
        // Firebase auth integration — depends on Firebase SDK, Google Sign-In,
        // expo-auth-session; would require mocking the entire auth flow
        'lib/hooks/use-auth.tsx',
        // Tab screens — heavy UI components with minimal testable logic
        'app/\\(tabs\\)/**',
        // Root layout — navigation configuration only
        'app/_layout.tsx',
      ],
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
