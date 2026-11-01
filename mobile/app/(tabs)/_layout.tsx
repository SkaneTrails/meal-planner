/**
 * Tab layout for main navigation.
 * Tab bar rendering is handled by FloatingTabBar in the root layout.
 * Requires authentication - redirects to sign-in if not authenticated.
 * Requires household membership - redirects to no-access if not in a household (except superusers).
 * Renders from the cached user at once; the server check runs in the background.
 */

import { Redirect, Tabs } from 'expo-router';
import { FullScreenLoading } from '@/components/FullScreenLoading';
import { ApiClientError } from '@/lib/api';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';
import { useLocalDataReady } from '@/lib/local-data-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const localDataReady = useLocalDataReady();
  const { data: currentUser, error } = useCurrentUser({
    enabled: !loading && !!user && localDataReady,
  });

  if (loading) {
    return <FullScreenLoading />;
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  if (!localDataReady) {
    return <FullScreenLoading />;
  }

  // A failed background check of a cached user (e.g. offline) keeps the app usable;
  // only a definite 403 (user not in any household) or no user at all means no access.
  const isForbidden = error instanceof ApiClientError && error.status === 403;
  if (isForbidden || (error && !currentUser)) {
    return <Redirect href="/no-access" />;
  }

  if (!currentUser) {
    return <FullScreenLoading />;
  }

  return (
    <Tabs
      tabBar={() => null}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="recipes" options={{ title: t('tabs.recipes') }} />
      <Tabs.Screen name="meal-plan" options={{ title: t('tabs.mealPlan') }} />
      <Tabs.Screen name="grocery" options={{ title: t('tabs.grocery') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
      <Tabs.Screen name="admin" options={{ title: t('tabs.admin') }} />
    </Tabs>
  );
}
