/**
 * Tab layout for main navigation.
 * Tab bar rendering is handled by FloatingTabBar in the root layout.
 * Requires authentication - redirects to sign-in if not authenticated.
 * Requires household membership - redirects to no-access if not in a household (except superusers).
 */

import { Redirect, Tabs } from 'expo-router';
import { FullScreenLoading } from '@/components';
import { useCurrentUser } from '@/lib/hooks/use-admin';
import { useAuth } from '@/lib/hooks/use-auth';
import { useTranslation } from '@/lib/i18n';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const { isLoading: userLoading, isError } = useCurrentUser({
    enabled: !loading && !!user,
  });

  if (loading) {
    return <FullScreenLoading background="muted" />;
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }

  if (userLoading) {
    return <FullScreenLoading background="muted" />;
  }

  // If API returns error (likely 403 - user not in any household), redirect to no-access
  // The no-access screen shows the user's email and a sign-out option
  if (isError) {
    return <Redirect href="/no-access" />;
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
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), href: null }}
      />
      <Tabs.Screen
        name="admin"
        options={{ title: t('tabs.admin'), href: null }}
      />
    </Tabs>
  );
}
