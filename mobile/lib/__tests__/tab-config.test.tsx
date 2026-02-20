/**
 * Tests for tab active-state detection logic.
 * Pure function tests — no Expo/RN mocks needed.
 */

import { describe, expect, it } from 'vitest';
import { TABS, isTabActive } from '@/lib/tab-config';

const homeTab = TABS.find((tab) => tab.labelKey === 'tabs.home')!;
const recipesTab = TABS.find((tab) => tab.labelKey === 'tabs.recipes')!;
const mealPlanTab = TABS.find((tab) => tab.labelKey === 'tabs.mealPlan')!;
const groceryTab = TABS.find((tab) => tab.labelKey === 'tabs.grocery')!;

describe('isTabActive', () => {
  describe('home tab', () => {
    it('matches root path "/"', () => {
      expect(isTabActive('/', homeTab)).toBe(true);
    });

    it('matches "/index"', () => {
      expect(isTabActive('/index', homeTab)).toBe(true);
    });

    it('does not match "/recipes"', () => {
      expect(isTabActive('/recipes', homeTab)).toBe(false);
    });

    it('does not match "/meal-plan"', () => {
      expect(isTabActive('/meal-plan', homeTab)).toBe(false);
    });
  });

  describe('recipes tab', () => {
    it('matches "/recipes"', () => {
      expect(isTabActive('/recipes', recipesTab)).toBe(true);
    });

    it('matches recipe detail "/recipe/abc123"', () => {
      expect(isTabActive('/recipe/abc123', recipesTab)).toBe(true);
    });

    it('does not match "/"', () => {
      expect(isTabActive('/', recipesTab)).toBe(false);
    });

    it('does not match "/grocery"', () => {
      expect(isTabActive('/grocery', recipesTab)).toBe(false);
    });
  });

  describe('meal plan tab', () => {
    it('matches "/meal-plan"', () => {
      expect(isTabActive('/meal-plan', mealPlanTab)).toBe(true);
    });

    it('does not match "/recipes"', () => {
      expect(isTabActive('/recipes', mealPlanTab)).toBe(false);
    });
  });

  describe('grocery tab', () => {
    it('matches "/grocery"', () => {
      expect(isTabActive('/grocery', groceryTab)).toBe(true);
    });

    it('does not match "/"', () => {
      expect(isTabActive('/', groceryTab)).toBe(false);
    });

    it('does not match "/recipes"', () => {
      expect(isTabActive('/recipes', groceryTab)).toBe(false);
    });
  });

  describe('normalizes (tabs) group prefix', () => {
    it('"/(tabs)/recipes" matches recipes tab', () => {
      expect(isTabActive('/(tabs)/recipes', recipesTab)).toBe(true);
    });

    it('"/(tabs)/meal-plan" matches meal plan tab', () => {
      expect(isTabActive('/(tabs)/meal-plan', mealPlanTab)).toBe(true);
    });

    it('"/(tabs)/grocery" matches grocery tab', () => {
      expect(isTabActive('/(tabs)/grocery', groceryTab)).toBe(true);
    });

    it('"/(tabs)" matches home tab', () => {
      expect(isTabActive('/(tabs)', homeTab)).toBe(true);
    });
  });
});
