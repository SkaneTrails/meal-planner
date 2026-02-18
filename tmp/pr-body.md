## Summary

CRT terminal theme treatment for all remaining screens, plus a runtime theme toggle so users can switch between default and terminal themes from Settings.

## Changes

### CRT Theme — Recipe Detail

- All sections wrapped in TerminalFrame containers (ingredients, instructions, enhanced info, notes, time/servings)
- Action buttons (edit/plan/share) rendered as pressable segments in the time/servings TerminalFrame top border
- Visibility label (PRIVATE/SHARED) in the time/servings top border right side
- TerminalFabBar with back/camera/thumbs up-down/favorite slots
- RecipeHero shows only the image in CRT (no gradient, title overlay, or rating)
- Dark green backgrounds for content sections, black for instructions
- Fixed black-on-black colors in MetaLabels chips, OriginalEnhancedToggle, and ActionsFooter

### CRT Theme — Other Screens

- Select-recipe, home screen, grocery list, household settings all CRT-ified
- Consistent TerminalFrame + TerminalFabBar patterns across the app

### Shared Component Extraction

- Extracted reusable components: Chip, ChipGroup, Section, SectionLabel, InlineAddInput, SettingToggleRow
- Replaced inline duplicates across settings, household settings, and recipe detail screens
- Tests for all new shared components

### Runtime Theme Toggle

- ThemeProvider now accepts `isTerminal` and `toggleTheme` props
- ThemeRoot component in root layout manages theme state via useState + AsyncStorage
- New Appearance section in Settings screen with "Terminal Mode" toggle
- Theme preference persists across app restarts
- Env var `EXPO_PUBLIC_THEME=terminal` still works as the initial default

### i18n

- Added appearance/terminal mode keys for all three locales (en/sv/it)

## Testing

- All 618 existing tests pass
- Pre-commit hooks pass (prettier, TypeScript, Biome)
