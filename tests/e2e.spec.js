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

  test('displays exercises with required structure', async ({ page }) => {
    const exercises = page.locator('.exercise');

    // Should have at least one exercise
    const count = await exercises.count();
    expect(count).toBeGreaterThan(0);

    // Each exercise should have name, sets, and reps displayed
    for (let i = 0; i < count; i++) {
      const exercise = exercises.nth(i);
      await expect(exercise.locator('.exercise-name')).toBeVisible();
      await expect(exercise.locator('.exercise-details')).toContainText(/\d+\s*sets/i);
      await expect(exercise.locator('.exercise-details')).toContainText(/reps|mins|s\b/i);
    }
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

  test('feedback toggle expands and collapses feedback section', async ({ page }) => {
    const feedbackToggle = page.locator('.feedback-toggle').first();
    const feedbackContent = page.locator('.feedback-content').first();

    // Initially collapsed
    await expect(feedbackContent).toBeHidden();

    // Click to expand
    await feedbackToggle.click();
    await expect(feedbackContent).toBeVisible();
    await expect(feedbackToggle).toContainText('Hide feedback');

    // Click to collapse
    await feedbackToggle.click();
    await expect(feedbackContent).toBeHidden();
    await expect(feedbackToggle).toContainText('Add feedback');
  });

  test('difficulty buttons can be selected', async ({ page }) => {
    // Expand feedback section
    await page.locator('.feedback-toggle').first().click();

    const difficultyButtons = page.locator('.difficulty-buttons').first();
    const hardBtn = difficultyButtons.locator('[data-difficulty="hard"]');
    const goodBtn = difficultyButtons.locator('[data-difficulty="good"]');

    // Good should be selected by default
    await expect(goodBtn).toHaveClass(/selected/);

    // Click hard
    await hardBtn.click();
    await expect(hardBtn).toHaveClass(/selected/);
    await expect(goodBtn).not.toHaveClass(/selected/);
  });

  test('difficulty saves to localStorage', async ({ page }) => {
    // Expand feedback section
    await page.locator('.feedback-toggle').first().click();

    // Select hard difficulty
    await page.locator('.difficulty-buttons').first().locator('[data-difficulty="hard"]').click();

    // Check localStorage
    const log = await page.evaluate(() => localStorage.getItem('basement_lab_log'));
    expect(log).toContain('"difficulty":"hard"');
  });

  test('failed button shows set/rep sliders', async ({ page }) => {
    // Expand feedback section
    await page.locator('.feedback-toggle').first().click();

    const failedDetails = page.locator('.failed-details').first();

    // Initially hidden
    await expect(failedDetails).toBeHidden();

    // Click failed button
    await page.locator('.difficulty-buttons').first().locator('[data-difficulty="failed"]').click();

    // Sliders should be visible
    await expect(failedDetails).toBeVisible();
    await expect(failedDetails.locator('.failed-set-slider')).toBeVisible();
    await expect(failedDetails.locator('.failed-rep-slider')).toBeVisible();
  });

  test('failed sliders save to localStorage', async ({ page }) => {
    // Expand feedback and select failed
    await page.locator('.feedback-toggle').first().click();
    await page.locator('.difficulty-buttons').first().locator('[data-difficulty="failed"]').click();

    // Adjust sliders
    const setSlider = page.locator('.failed-set-slider').first();
    const repSlider = page.locator('.failed-rep-slider').first();

    await setSlider.fill('2');
    await repSlider.fill('5');

    // Check localStorage
    const log = await page.evaluate(() => localStorage.getItem('basement_lab_log'));
    expect(log).toContain('"failedSet":2');
    expect(log).toContain('"failedRep":5');
  });

  test('notes textarea saves to localStorage', async ({ page }) => {
    // Expand feedback section
    await page.locator('.feedback-toggle').first().click();

    const notesField = page.locator('.notes-field').first();
    await notesField.fill('Felt strong today');

    // Check localStorage
    const log = await page.evaluate(() => localStorage.getItem('basement_lab_log'));
    expect(log).toContain('Felt strong today');
  });

  test('feedback persists after reload', async ({ page }) => {
    // Expand feedback and set values
    await page.locator('.feedback-toggle').first().click();
    await page.locator('.difficulty-buttons').first().locator('[data-difficulty="hard"]').click();
    await page.locator('.notes-field').first().fill('Test note');

    // Reload
    await page.reload();

    // Feedback section should be expanded (has custom feedback)
    const feedbackContent = page.locator('.feedback-content').first();
    await expect(feedbackContent).toBeVisible();

    // Values should persist
    const hardBtn = page.locator('.difficulty-buttons').first().locator('[data-difficulty="hard"]');
    await expect(hardBtn).toHaveClass(/selected/);
    await expect(page.locator('.notes-field').first()).toHaveValue('Test note');
  });
});
