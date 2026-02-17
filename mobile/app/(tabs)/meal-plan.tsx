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
import { GradientBackground } from '@/components';
import { CollapsedDayRow } from '@/components/meal-plan/CollapsedDayRow';
import { DayHeader } from '@/components/meal-plan/DayHeader';
import { EmptyMealSlot } from '@/components/meal-plan/EmptyMealSlot';
import { ExtrasSection } from '@/components/meal-plan/ExtrasSection';
import { FilledMealSlot } from '@/components/meal-plan/FilledMealSlot';
import { GrocerySelectionModal } from '@/components/meal-plan/GrocerySelectionModal';
import { WeekSelector } from '@/components/meal-plan/WeekSelector';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useMealPlanActions } from '@/lib/hooks/useMealPlanActions';
import {
  borderRadius,
  colors,
  iconContainer,
  iconSize,
  layout,
  shadows,
  spacing,
} from '@/lib/theme';
import { formatDateLocal, isPastDate } from '@/lib/utils/dateFormatter';

export default function MealPlanScreen() {
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

                if (isPast && !isExpanded) {
                  return (
                    <CollapsedDayRow
                      key={date.toISOString()}
                      date={date}
                      mealCount={countMealsForDate(date)}
                      language={language}
                      t={t}
                      onExpand={() => togglePastDay(dateStr)}
                    />
                  );
                }

                return (
                  <View
                    key={date.toISOString()}
                    style={{
                      marginBottom: spacing.lg,
                      backgroundColor: isToday
                        ? colors.glass.heavy
                        : colors.glass.solid,
                      borderRadius: borderRadius.lg,
                      padding: spacing['md-lg'],
                      borderWidth: 1,
                      borderColor: isToday
                        ? colors.surface.active
                        : colors.glass.border,
                      boxShadow: shadows.cardRaised.boxShadow,
                      opacity: isPast ? 0.6 : 1,
                    }}
                  >
                    {isPast && (
                      <Pressable
                        onPress={() => togglePastDay(dateStr)}
                        style={{
                          position: 'absolute',
                          top: spacing.sm,
                          right: spacing.sm,
                          padding: spacing.xs,
                          zIndex: 1,
                        }}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={iconSize.md}
                          color={colors.content.subtitle}
                        />
                      </Pressable>
                    )}
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
                            t={t}
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
                );
              })}

              {/* Separator line before Others */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: spacing.lg,
                  marginHorizontal: spacing.sm,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: colors.surface.divider,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: borderRadius['2xs'],
                    backgroundColor: colors.surface.border,
                    marginHorizontal: spacing.md,
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: colors.surface.divider,
                  }}
                />
              </View>

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

        {/* Floating Grocery List FAB - always visible */}
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
            {/* Small + badge */}
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

        {/* Floating Jump to Today - icon-only circle */}
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
              <Ionicons name="today" size={iconSize.md} color={colors.white} />
            </Pressable>
          </Animated.View>
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
