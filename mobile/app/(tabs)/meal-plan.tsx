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
import { AnimatedPressable, GradientBackground } from '@/components';
import { DayHeader } from '@/components/meal-plan/DayHeader';
import { EmptyMealSlot } from '@/components/meal-plan/EmptyMealSlot';
import { ExtrasSection } from '@/components/meal-plan/ExtrasSection';
import { FilledMealSlot } from '@/components/meal-plan/FilledMealSlot';
import { GrocerySelectionModal } from '@/components/meal-plan/GrocerySelectionModal';
import { WeekSelector } from '@/components/meal-plan/WeekSelector';
import { useMealPlanActions } from '@/lib/hooks/useMealPlanActions';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  layout,
  letterSpacing,
  spacing,
} from '@/lib/theme';
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
      <View
        style={{ flex: 1, paddingBottom: layout.tabBar.contentBottomPadding }}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}
        >
          <Text
            style={{
              fontSize: fontSize['3xl'],
              fontFamily: fontFamily.displayBold,
              fontWeight: '700',
              color: '#3D3D3D',
              letterSpacing: letterSpacing.tight,
              textAlign: 'center',
            }}
          >
            {t('mealPlan.title')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fontFamily.body,
              color: 'rgba(93, 78, 64, 0.6)',
              marginTop: 2,
              textAlign: 'center',
            }}
          >
            {t('mealPlan.subtitle')}
          </Text>
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
                        ? 'rgba(255, 255, 255, 0.96)'
                        : 'rgba(255, 255, 255, 0.92)',
                      borderRadius: 18,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: isToday
                        ? 'rgba(93, 78, 64, 0.12)'
                        : 'rgba(0, 0, 0, 0.04)',
                      shadowColor: '#000',
                      shadowOffset: { width: 2, height: 6 },
                      shadowOpacity: 0.1,
                      shadowRadius: 16,
                      elevation: 4,
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
                    backgroundColor: 'rgba(93, 78, 64, 0.2)',
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(93, 78, 64, 0.3)',
                    marginHorizontal: 12,
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(93, 78, 64, 0.2)',
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
              <AnimatedPressable
                onPress={openGroceryModal}
                hoverScale={1.02}
                pressScale={0.98}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#7A6858',
                  paddingVertical: 16,
                  borderRadius: 16,
                  marginTop: 8,
                  marginBottom: 20,
                  shadowColor: '#000',
                  shadowOffset: { width: 2, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <Ionicons name="cart-outline" size={20} color={colors.white} />
                <Text
                  style={{
                    marginLeft: 10,
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    color: colors.white,
                  }}
                >
                  {t('mealPlan.createList')}
                </Text>
              </AnimatedPressable>
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
                backgroundColor: 'rgba(93, 78, 64, 0.85)',
                paddingHorizontal: spacing.lg,
                paddingVertical: 10,
                borderRadius: borderRadius.full,
                shadowColor: '#000',
                shadowOffset: { width: 1, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
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
