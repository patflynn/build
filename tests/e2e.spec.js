// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Basement Lab PWA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads without errors', async ({ page }) => {
    // Check no console errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('displays header with day counter', async ({ page }) => {
    await expect(page.locator('header h1')).toContainText('BASEMENT LAB');
    await expect(page.locator('#day-counter')).toContainText('DAY');
    await expect(page.locator('#current-day')).toContainText('1');
  });

  test('shows workout card for Day 1', async ({ page }) => {
    await expect(page.locator('#workout-card')).toBeVisible();
    await expect(page.locator('#workout-name')).toContainText('Posterior Chain');
    await expect(page.locator('#rest-day')).toBeHidden();
  });

  test('displays exercises with details', async ({ page }) => {
    const exercises = page.locator('.exercise');
    await expect(exercises).toHaveCount(5); // Workout A has 5 exercises (1 warmup + 4 main)

    // Check first exercise (warmup)
    const firstExercise = exercises.first();
    await expect(firstExercise.locator('.exercise-name')).toContainText('Warmup');
    await expect(firstExercise.locator('.exercise-details')).toContainText('sets');
    await expect(firstExercise.locator('.exercise-details')).toContainText('reps');
  });

  test('video button opens modal', async ({ page }) => {
    const videoBtn = page.locator('.video-btn').first();
    await expect(videoBtn).toBeEnabled();

    await videoBtn.click();

    await expect(page.locator('#video-modal')).toBeVisible();
    await expect(page.locator('#video-container iframe')).toBeVisible();
  });

  test('video modal closes on X button', async ({ page }) => {
    await page.locator('.video-btn').first().click();
    await expect(page.locator('#video-modal')).toBeVisible();

    await page.locator('#close-modal').click();
    await expect(page.locator('#video-modal')).toBeHidden();
  });

  test('weight input saves to localStorage', async ({ page }) => {
    const weightInput = page.locator('.weight-field').first();
    await weightInput.fill('35');

    // Check localStorage
    const log = await page.evaluate(() => localStorage.getItem('basement_lab_log'));
    expect(log).toContain('35');
  });

  test('complete button advances day', async ({ page }) => {
    await expect(page.locator('#current-day')).toContainText('1');

    await page.locator('#complete-btn').click();

    await expect(page.locator('#current-day')).toContainText('2');
  });

  test('state persists after reload', async ({ page }) => {
    // Advance to day 2
    await page.locator('#complete-btn').click();
    await expect(page.locator('#current-day')).toContainText('2');

    // Reload
    await page.reload();

    // Should still be day 2
    await expect(page.locator('#current-day')).toContainText('2');
  });

  test('reset button clears progress', async ({ page }) => {
    // Advance a few days
    await page.locator('#complete-btn').click();
    await page.locator('#complete-btn').click();
    await expect(page.locator('#current-day')).toContainText('3');

    // Handle confirm dialog
    page.on('dialog', dialog => dialog.accept());

    await page.locator('#reset-btn').click();

    await expect(page.locator('#current-day')).toContainText('1');
  });

  test('shows rest day on day 6', async ({ page }) => {
    // Advance to day 6 (schedule: A, B, A, B, C, Rest, Rest)
    for (let i = 0; i < 5; i++) {
      await page.locator('#complete-btn').click();
    }

    await expect(page.locator('#current-day')).toContainText('6');
    await expect(page.locator('#rest-day')).toBeVisible();
    await expect(page.locator('#workout-card')).toBeHidden();
  });

  test('has dark theme colors', async ({ page }) => {
    const body = page.locator('body');
    const bgColor = await body.evaluate(el =>
      getComputedStyle(el).backgroundColor
    );

    // Should be dark (rgb values close to 0)
    expect(bgColor).toMatch(/rgb\(\s*10,\s*10,\s*10\s*\)/);
  });
});
