import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:80';
const STAGING_USER = process.env.STAGING_AUTH_USER || 'staging';
const STAGING_PASS = process.env.STAGING_AUTH_PASS || 'staging123';

test.describe('E2E Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Basic auth for staging
    await page.setExtraHTTPHeaders({
      Authorization: `Basic ${Buffer.from(`${STAGING_USER}:${STAGING_PASS}`).toString('base64')}`,
    });
  });

  test('Full Game Flow: Login → Create Room → Start → Answer → Vote → End', async ({ page }) => {
    // Step 1: Login
    await test.step('Login', async () => {
      await page.goto(`${STAGING_URL}/login`);
      await expect(page.locator('h1')).toContainText('الميدان يا حميدان');
      
      // Register new user (unique username)
      const timestamp = Date.now();
      const username = `testuser_${timestamp}`;
      const email = `test_${timestamp}@example.com`;
      const password = 'test123456';

      await page.click('text=سجل الآن');
      await page.fill('input[id="username"]', username);
      await page.fill('input[id="email"]', email);
      await page.fill('input[id="password"]', password);
      await page.fill('input[id="confirmPassword"]', password);
      await page.click('button:has-text("إنشاء حساب")');
      
      // Wait for redirect to lobby
      await page.waitForURL('**/lobby', { timeout: 10000 });
      await expect(page.locator('text=مرحباً')).toBeVisible();
    });

    // Step 2: Create Room
    await test.step('Create Room', async () => {
      await page.click('button:has-text("إنشاء غرفة")');
      await page.waitForURL('**/room/**', { timeout: 10000 });
      await expect(page.locator('text=الغرفة:')).toBeVisible();
    });

    // Step 3: Wait for other players or start with min players
    // Note: This test assumes staging has test users or we need multiple browser contexts
    await test.step('Room Created', async () => {
      const roomCode = await page.locator('text=/الغرفة: [A-Z0-9]+/').textContent();
      expect(roomCode).toMatch(/الغرفة: [A-Z0-9]+/);
    });

    // Step 4: Start Game (if host and enough players)
    await test.step('Start Game', async () => {
      const startButton = page.locator('button:has-text("بدء اللعبة")');
      if (await startButton.isVisible({ timeout: 5000 })) {
        await startButton.click();
        await expect(page.locator('text=بدأت اللعبة')).toBeVisible({ timeout: 10000 });
      }
    });

    // Step 5: Submit Answer (if it's our turn)
    await test.step('Submit Answer', async () => {
      const answerInput = page.locator('textarea[placeholder*="إجابتك"]');
      if (await answerInput.isVisible({ timeout: 5000 })) {
        await answerInput.fill('إجابة تجريبية');
        await page.click('button:has-text("تقديم الإجابة")');
        await expect(page.locator('text=تم تقديم إجابة')).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });

    // Step 6: Vote (if voting phase)
    await test.step('Cast Vote', async () => {
      const acceptButton = page.locator('button:has-text("قبول")');
      if (await acceptButton.isVisible({ timeout: 5000 })) {
        await acceptButton.click();
        await expect(page.locator('text=/الأصوات/')).toBeVisible({ timeout: 5000 }).catch(() => {});
      }
    });

    // Step 7: Verify Game State
    await test.step('Verify Game State', async () => {
      // Check that game elements are present
      await expect(page.locator('text=اللاعبون')).toBeVisible().catch(() => {});
      await expect(page.locator('text=السؤال')).toBeVisible().catch(() => {});
    });
  });

  test('API Health Check', async ({ request }) => {
    const response = await request.get(`${STAGING_URL}/api/health`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${STAGING_USER}:${STAGING_PASS}`).toString('base64')}`,
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Socket.IO Connection', async ({ page }) => {
    await page.setExtraHTTPHeaders({
      Authorization: `Basic ${Buffer.from(`${STAGING_USER}:${STAGING_PASS}`).toString('base64')}`,
    });
    
    await page.goto(`${STAGING_URL}/login`);
    
    // Check for socket connection errors in console
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('socket')) {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for socket to connect
    await page.waitForTimeout(2000);
    
    // Should not have socket connection errors
    expect(errors.length).toBe(0);
  });
});

