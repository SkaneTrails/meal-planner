import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { GradientBackground, PrimaryButton } from '@/components';
import { DayHeader } from '@/components/meal-plan/DayHeader';
import { EmptyMealSlot } from '@/components/meal-plan/EmptyMealSlot';
import { ExtrasSection } from '@/components/meal-plan/ExtrasSection';
import { FilledMealSlot } from '@/components/meal-plan/FilledMealSlot';
import { GrocerySelectionModal } from '@/components/meal-plan/GrocerySelectionModal';
import { WeekSelector } from '@/components/meal-plan/WeekSelector';
import { ScreenTitle } from '@/components/ScreenTitle';
import { useMealPlanActions } from '@/lib/hooks/useMealPlanActions';
import { borderRadius, colors, fontFamily, layout, spacing } from '@/lib/theme';
import { formatDateLocal } from '@/lib/utils/dateFormatter';

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
  } = useMealPlanActions();

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(event.nativeEvent.contentOffset.y);
  };

  return (
    <GradientBackground structured>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
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
                paddingHorizontal: 20,
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
                const note = getNoteForDate(date);
                const isEditing = editingNoteDate === dateStr;

                return (
                  <View
                    key={date.toISOString()}
                    style={{
                      marginBottom: 16,
                      backgroundColor: isToday
                        ? colors.glass.heavy
                        : colors.glass.solid,
                      borderRadius: 18,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: isToday
                        ? colors.surface.active
                        : 'rgba(0, 0, 0, 0.04)',
                      boxShadow: '2px 6px 16px 0px rgba(0, 0, 0, 0.1)',
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
                  marginVertical: 16,
                  marginHorizontal: 8,
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
                    borderRadius: 4,
                    backgroundColor: colors.surface.border,
                    marginHorizontal: 12,
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

              {/* Skapa lista button at end of list */}
              <View style={{ marginTop: 8, marginBottom: 20 }}>
                <PrimaryButton
                  onPress={openGroceryModal}
                  icon="cart-outline"
                  label={t('mealPlan.createList')}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </View>

        {/* Floating Jump to Today button - refined: smaller, more translucent */}
        {(showJumpButton || weekOffset !== 0) && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 110,
              alignSelf: 'center',
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
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface.overlay,
                paddingHorizontal: spacing.lg,
                paddingVertical: 10,
                borderRadius: borderRadius.full,
                boxShadow: '1px 2px 8px 0px rgba(0, 0, 0, 0.15)',
              }}
            >
              <Ionicons name="today" size={16} color={colors.white} />
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 13,
                  fontFamily: fontFamily.bodySemibold,
                  color: colors.white,
                }}
              >
                {t('mealPlan.jumpToToday')}
              </Text>
            </Pressable>
          </Animated.View>
        )}

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
      </View>
    </GradientBackground>
  );
}
