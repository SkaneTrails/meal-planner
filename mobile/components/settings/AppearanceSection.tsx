import { Section } from '@/components';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';

export const AppearanceSection = () => {
  const { themeName, setThemeName } = useTheme();
  const { t } = useTranslation();

  return (
    <Section
      icon="color-palette"
      title={t('settings.appearance')}
      subtitle={t('settings.appearanceDesc')}
      spacing={spacing['2xl']}
    >
      <ThemePicker currentTheme={themeName} onChangeTheme={setThemeName} />
    </Section>
  );
};
