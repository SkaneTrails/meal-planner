import { Section, SettingToggleRow, SurfaceCard } from '@/components';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';

export const AppearanceSection = () => {
  const { isTerminal, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Section
      icon="color-palette"
      title={t('settings.appearance')}
      subtitle={t('settings.appearanceDesc')}
      spacing={spacing['2xl']}
    >
      <SurfaceCard>
        <SettingToggleRow
          label={t('settings.terminalMode')}
          subtitle={t('settings.terminalModeDesc')}
          value={isTerminal}
          onValueChange={toggleTheme}
        />
      </SurfaceCard>
    </Section>
  );
};
