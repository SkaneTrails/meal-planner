import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import {
  GradientBackground,
  TerminalDivider,
  TerminalFabBar,
  TerminalFrame,
} from '@/components';
import { DayHeader } from '@/components/meal-plan/DayHeader';
import { EmptyMealSlot } from '@/components/meal-plan/EmptyMealSlot';
import { ExtrasSection } from '@/components/meal-plan/ExtrasSection';
import { FilledMealSlot } from '@/components/meal-plan/FilledMealSlot';
import { GrocerySelectionModal } from '@/components/meal-plan/GrocerySelectionModal';
import { WeekSelector } from '@/components/meal-plan/WeekSelector';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useMealPlanActions } from '@/lib/hooks/useMealPlanActions';
import {
  iconContainer,
  iconSize,
  layout,
  spacing,
  useTheme,
} from '@/lib/theme';
import {
  formatDateLocal,
  formatDayHeader,
  isPastDate,
} from '@/lib/utils/dateFormatter';

export default function MealPlanScreen() {
  const { colors, borderRadius, shadows, overrides, chrome } = useTheme();
  const {
    t,
    language,
    MEAL_TYPES,
    NOTE_SUGGESTIONS,
    mealPlanLoading,
    weekDates,
    groceryWeekDates,
    weekOffset,
    setWeekOffset,
    showGroceryModal,
    setShowGroceryModal,
    setGroceryWeekOffset,
    selectedMeals,
    mealServings,
    showJumpButton,
    editingNoteDate,
    noteText,
    setNoteText,
    scrollViewRef,
    todayY,
    jumpButtonOpacity,
    swipeTranslateX,
    panResponder,
    handleScroll,
    jumpToToday,
    refetchMealPlan,
    getNoteForDate,
    getMealForSlot,
    handleStartEditNote,
    handleSaveNote,
    handleCancelEditNote,
    handleAddTag,
    handleMealPress,
    handleRemoveMeal,
    handleToggleMeal,
    handleChangeServings,
    handleCreateGroceryList,
    openGroceryModal,
    getExtrasRecipes,
    handleAddExtra,
    handleRemoveExtra,
    expandedPastDays,
    togglePastDay,
    countMealsForDate,
  } = useMealPlanActions();

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event.nativeEvent.contentOffset.y);
  };

  return (
    <GradientBackground structured>
      <View style={[{ flex: 1 }, layout.contentContainer]}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
          }}
        >
          <ScreenTitle
            title={t('mealPlan.title')}
            subtitle={t('mealPlan.subtitle')}
          />
        </View>

        <WeekSelector
          weekDates={weekDates}
          weekOffset={weekOffset}
          language={language}
          t={t}
          onPreviousWeek={() => setWeekOffset((prev) => prev - 1)}
          onNextWeek={() => setWeekOffset((prev) => prev + 1)}
          onJumpToToday={() => setWeekOffset(0)}
        />

        {/* Meal list with swipe gesture */}
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
          <Animated.View
            style={{ flex: 1, transform: [{ translateX: swipeTranslateX }] }}
          >
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: spacing.xl,
                paddingBottom: layout.tabBar.contentBottomPadding,
              }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={mealPlanLoading}
                  onRefresh={() => refetchMealPlan()}
                  tintColor={colors.accent}
                />
              }
            >
              {weekDates.map((date) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const dateStr = formatDateLocal(date);
                const isPast = !isToday && isPastDate(date);
                const isExpanded = expandedPastDays.has(dateStr);
                const note = getNoteForDate(date);
                const isEditing = editingNoteDate === dateStr;

                const isCollapsed = isPast && !isExpanded;
                const mealCount = countMealsForDate(date);
                const summary =
                  mealCount > 0
                    ? t('mealPlan.mealsPlanned', { count: mealCount })
                    : t('mealPlan.noMeals');

                const rightSegments = isCollapsed
                  ? [
                      { label: summary },
                      {
                        label: '\u25BC',
                        onPress: () => togglePastDay(dateStr),
                      },
                    ]
                  : [
                      ...(note
                        ? [
                            {
                              label: note,
                              onPress: () => handleStartEditNote(date),
                            },
                          ]
                        : [
                            {
                              label: '+',
                              onPress: () => handleStartEditNote(date),
                            },
                          ]),
                      ...(isPast
                        ? [
                            {
                              label: '\u25B2',
                              onPress: () => togglePastDay(dateStr),
                            },
                          ]
                        : []),
                    ];

                const frameLabel = isCollapsed
                  ? formatDayHeader(date, language, '')
                  : isToday
                    ? t('mealPlan.today').toUpperCase()
                    : undefined;

                return (
                  <TerminalFrame
                    key={date.toISOString()}
                    label={frameLabel}
                    rightSegments={rightSegments}
                    variant={isToday ? 'double' : 'single'}
                    collapsed={isCollapsed}
                    style={{
                      marginBottom: isCollapsed ? spacing.sm : spacing.lg,
                      opacity: isPast ? 0.6 : 1,
                    }}
                  >
                    <View
                      onLayout={
                        isToday
                          ? (e) => {
                              todayY.current = e.nativeEvent.layout.y;
                            }
                          : undefined
                      }
                      style={{
                        backgroundColor: isToday
                          ? colors.dayCard.bgToday
                          : colors.dayCard.bg,
                        borderRadius: borderRadius.lg,
                        padding: spacing['md-lg'],
                        borderWidth: isToday
                          ? overrides.dayCardBorderWidthToday
                          : overrides.dayCardBorderWidth,
                        borderColor: isToday
                          ? colors.ai.primary
                          : colors.glass.border,
                        boxShadow: shadows.cardRaised.boxShadow,
                      }}
                    >
                      <DayHeader
                        date={date}
                        isToday={isToday}
                        language={language}
                        t={t}
                        note={note}
                        isEditing={isEditing}
                        noteText={noteText}
                        noteSuggestions={NOTE_SUGGESTIONS}
                        onNoteTextChange={setNoteText}
                        onStartEdit={() => handleStartEditNote(date)}
                        onSaveNote={handleSaveNote}
                        onCancelEdit={handleCancelEditNote}
                        onToggleTag={handleAddTag}
                        onCollapse={
                          isPast ? () => togglePastDay(dateStr) : undefined
                        }
                      />

                      {MEAL_TYPES.map(({ type, label }) => {
                        const meal = getMealForSlot(date, type);
                        if (!meal) {
                          return (
                            <EmptyMealSlot
                              key={`${date.toISOString()}-${type}`}
                              date={date}
                              mealType={type}
                              label={label}
                              onPress={handleMealPress}
                            />
                          );
                        }
                        return (
                          <FilledMealSlot
                            key={`${date.toISOString()}-${type}`}
                            date={date}
                            mealType={type}
                            label={label}
                            recipe={meal.recipe}
                            customText={meal.customText}
                            onRemove={handleRemoveMeal}
                            onMealPress={handleMealPress}
                          />
                        );
                      })}
                    </View>
                  </TerminalFrame>
                );
              })}

              {/* Separator line before Others */}
              <TerminalDivider decoration="◆" />

              {/* Other/Extras section */}
              <ExtrasSection
                recipes={getExtrasRecipes()}
                t={t}
                onAddExtra={handleAddExtra}
                onRemoveExtra={handleRemoveExtra}
              />
            </ScrollView>
          </Animated.View>
        </View>

        {/* Floating action buttons — flat: fixed grid bar, full: stacked circles */}
        {chrome === 'flat' ? (
          <TerminalFabBar
            style={{
              position: 'absolute',
              bottom: layout.tabBar.overlayBottomOffset + spacing.lg,
              right: spacing.lg,
            }}
            slots={[
              {
                key: 'today',
                label: `\u25C8 ${t('mealPlan.today').toUpperCase()}`,
                active: showJumpButton || weekOffset !== 0,
                onPress: jumpToToday,
              },
              {
                key: 'grocery',
                label: `\u2637 ${t('tabs.grocery').toUpperCase()}`,
                active: true,
                onPress: openGroceryModal,
              },
            ]}
          />
        ) : (
          <>
            {/* Floating Grocery List FAB */}
            <View
              style={{
                position: 'absolute',
                bottom: layout.tabBar.overlayBottomOffset + spacing.xl,
                right: spacing.xl,
              }}
            >
              <Pressable
                onPress={openGroceryModal}
                style={{
                  width: iconContainer.xl,
                  height: iconContainer.xl,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.surface.overlay,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: shadows.float.boxShadow,
                }}
              >
                <Ionicons name="cart" size={iconSize.xl} color={colors.white} />
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="add" size={12} color={colors.white} />
                </View>
              </Pressable>
            </View>

            {/* Floating Jump to Today */}
            {(showJumpButton || weekOffset !== 0) && (
              <Animated.View
                style={{
                  position: 'absolute',
                  bottom:
                    layout.tabBar.overlayBottomOffset +
                    spacing.xl +
                    iconContainer.xl +
                    spacing.md,
                  right: spacing.xl,
                  opacity: weekOffset !== 0 ? 1 : jumpButtonOpacity,
                  transform: [
                    {
                      scale:
                        weekOffset !== 0
                          ? 1
                          : jumpButtonOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.85, 1],
                            }),
                    },
                  ],
                }}
              >
                <Pressable
                  onPress={jumpToToday}
                  style={{
                    width: iconContainer.md,
                    height: iconContainer.md,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.surface.overlay,
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: shadows.float.boxShadow,
                  }}
                >
                  <Ionicons
                    name="today"
                    size={iconSize.md}
                    color={colors.white}
                  />
                </Pressable>
              </Animated.View>
            )}
          </>
        )}
      </View>

      <GrocerySelectionModal
        visible={showGroceryModal}
        groceryWeekDates={groceryWeekDates}
        language={language}
        t={t}
        mealTypes={MEAL_TYPES}
        selectedMeals={selectedMeals}
        mealServings={mealServings}
        getMealForSlot={getMealForSlot}
        onClose={() => setShowGroceryModal(false)}
        onCreateGroceryList={handleCreateGroceryList}
        onToggleMeal={handleToggleMeal}
        onChangeServings={handleChangeServings}
        onPreviousWeek={() => setGroceryWeekOffset((prev) => prev - 1)}
        onNextWeek={() => setGroceryWeekOffset((prev) => prev + 1)}
      />
    </GradientBackground>
  );
}
