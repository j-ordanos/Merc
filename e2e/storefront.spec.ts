import { test, expect } from '@playwright/test';
import { sampleProducts } from '../src/features/catalog/data';
test('category tiles, seasonal picks, and styled sorting lead to real catalog views', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.locator('.home-hero-tile')).toHaveCount(3);
  await page.locator('.home-hero-tile').filter({ hasText: 'Accessories' }).click();
  await expect(page).toHaveURL(/category=accessories/);
  await expect(page.locator('.product-card')).toHaveCount(6);
  await page.goto('/');
  await page.getByRole('link', { name: /New season picks/ }).click();
  await expect(page).toHaveURL(/collection=new-season/);
  await expect(page.locator('.product-card')).toHaveCount(5);
  await page.getByRole('button', { name: 'Sort products' }).click();
  await page.getByRole('option', { name: 'Price: low to high' }).click();
  await expect(page.locator('.product-card').first()).toContainText('Daily Notes');
  await page.getByRole('button', { name: 'View all products' }).click();
  await expect(page.locator('.product-card')).toHaveCount(18);
  const nav = page.getByRole('navigation', {
    name: testInfo.project.name === 'mobile' ? 'Mobile navigation' : 'Main navigation',
  });
  if (testInfo.project.name === 'mobile')
    await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(nav.getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Instagram (demo link)' })).toHaveAttribute(
    'href',
    'https://www.instagram.com/',
  );
  await expect(page.getByRole('link', { name: 'StarPay payment gateway' })).toHaveAttribute(
    'href',
    'https://www.starpayethiopia.com/',
  );
});
test('catalog filters, details, quantity controls, and persisted bag', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Good things for home and everyday life.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Shop all products', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Shop all products', exact: true })).toBeVisible();
  await expect(page.locator('.catalog-toolbar')).toBeVisible();
  await page.screenshot({ path: `artifacts/catalog-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: 'Accessories', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'All products' }).click();
  await page.getByRole('textbox', { name: 'Search the collection' }).fill('Everyday Mug');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('heading', { name: 'The Everyday Mug', exact: true }).click();
  await expect(page.locator('.product-detail')).toBeVisible();
  await page.screenshot({ path: `artifacts/product-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: 'Increase The Everyday Mug quantity' }).click();
  await page.getByRole('button', { name: 'Add The Everyday Mug to bag', exact: true }).click();
  await expect(page.getByText('The Everyday Mug added to bag')).toBeVisible();
  await page.getByRole('link', { name: 'View your bag' }).click();
  await expect(page.locator('.quantity span')).toHaveText('2');
  await page.reload();
  await expect(page.locator('.quantity span')).toHaveText('2');
  await page.getByRole('button', { name: 'Remove The Everyday Mug' }).click();
  await expect(page.getByRole('heading', { name: 'Your bag is empty' })).toBeVisible();
});

test('shopping through login, checkout, pending recovery and confirmed payment', async ({
  page,
}) => {
  let signedIn = false;
  let verified = false;
  let unavailable = true;
  const product = sampleProducts[0];
  const id = '00000000-0000-4000-8000-000000000099';
  const delivery = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '0900000000',
    city: 'Addis Ababa',
    address: 'Bole, test building 123',
    instructions: '',
  };
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      json: {
        user: signedIn ? { id: 'test-user', email: delivery.email } : null,
        configured: true,
      },
    }),
  );
  await page.route('**/api/auth/login', async (route) => {
    signedIn = true;
    await route.fulfill({ json: { ok: true } });
  });
  await page.route('**/api/checkout', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.items).toEqual([{ productId: product.id, quantity: 1 }]);
    expect(body.delivery.phone).toBe('0900000000');
    expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    await route.fulfill({
      json: { orderId: id, paymentUrl: `http://127.0.0.1:3100/orders/${id}` },
    });
  });
  await page.route(`**/api/orders/${id}/verify`, (route) =>
    route.fulfill({
      json: {
        verification: unavailable ? 'unavailable' : 'verified',
        order: {
          id,
          user_id: 'test-user',
          status: verified ? 'paid' : 'pending',
          total_minor: 85000,
          currency: 'ETB',
          delivery,
          created_at: new Date().toISOString(),
          order_items: [
            {
              product_id: product.id,
              name: product.name,
              description: product.description,
              image_url: product.image_url,
              quantity: 1,
              unit_price_minor: 85000,
            },
          ],
        },
      },
    }),
  );
  await page.goto(`/products/${product.slug}`);
  await page.getByRole('button', { name: 'Add The Everyday Mug to bag', exact: true }).click();
  await page.goto('/cart');
  await page.getByRole('link', { name: 'Continue to checkout' }).click();
  await expect(page).toHaveURL(/auth\/login/);
  await page.getByLabel('Email address').fill(delivery.email);
  await page.getByLabel('Password', { exact: true }).fill('a-test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to StarPay' }).click();
  await expect(page.locator('#name-error')).toBeVisible();
  await page.getByLabel('Full name').fill(delivery.name);
  await page.getByLabel('Delivery address').fill(delivery.address);
  await page.getByRole('button', { name: 'Continue to StarPay' }).click();
  await expect(
    page.getByRole('heading', { name: 'Waiting for payment confirmation' }),
  ).toBeVisible();
  await expect(
    page.getByText('We can’t verify this payment right now.', { exact: false }),
  ).toBeVisible();
  unavailable = false;
  verified = true;
  await page.getByRole('button', { name: 'Check payment status' }).click();
  await expect(page.getByRole('heading', { name: 'Payment confirmed' })).toBeVisible();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your bag is empty' })).toBeVisible();
});

test('accessible navigation, mobile layout, and honest service errors', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await expect(
    page
      .getByRole('navigation', { name: 'Footer navigation' })
      .getByRole('link', { name: 'Help center', exact: true }),
  ).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await page.getByRole('button', { name: 'Close menu' }).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Skip to content' }).blur();
  for (const img of await page.locator('main img').all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((element: HTMLImageElement) => element.decode());
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: `artifacts/home-${testInfo.project.name}.png`, fullPage: true });
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill('test@example.com');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.notice-error')).toContainText('being set up');
  await page.goto('/products?q=nonexistent-product');
  await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
});

test('global search, shopping guide and scroll-aware header work across routes', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Search products' }).click();
  await expect(page.getByRole('dialog', { name: 'Search products' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search products' }).fill('no-match-at-all');
  await expect(page.getByText('No products match', { exact: false })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Search products' })).toBeFocused();
  await page.getByRole('button', { name: 'Search products' }).click();
  await page.getByRole('searchbox', { name: 'Search products' }).fill('mUG');
  await expect(
    page.getByRole('dialog').getByRole('link', { name: /The Everyday Mug/ }),
  ).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: /The Everyday Mug/ })
    .click();
  await expect(page).toHaveURL(/products\/everyday-ceramic-mug/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/docs');
  await expect(page.getByRole('heading', { name: 'Eight simple steps' })).toBeVisible();
  await expect(page.locator('.steps-grid li')).toHaveCount(8);
  await page.getByRole('link', { name: 'Common questions' }).click();
  await expect(page.getByRole('heading', { name: 'Common questions' })).toBeVisible();
  await page.goto('/story');
  await expect(page.getByRole('heading', { name: 'A simpler place to shop.' })).toBeVisible();
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy at Merc' })).toBeVisible();
  await page.goto('/');
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
  );
  await expect(page.locator('.site-header')).toHaveClass(/is-hidden/);
  await page.evaluate(() => window.scrollBy({ top: -120, behavior: 'instant' }));
  await expect(page.locator('.site-header')).not.toHaveClass(/is-hidden/);
});

test('public pages have share metadata and private pages are noindex', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://127.0.0.1:3100',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'http://127.0.0.1:3100/opengraph-image',
  );
  await page.goto('/products/everyday-ceramic-mug');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://127.0.0.1:3100/products/everyday-ceramic-mug',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'The Everyday Mug | Merc',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /images\.unsplash\.com/,
  );
  const image = await request.get('/opengraph-image');
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toContain('image/png');
  expect(await (await request.get('/sitemap.xml')).text()).toContain(
    '/products/everyday-ceramic-mug',
  );
  const rules = await (await request.get('/robots.txt')).text();
  expect(rules).toContain('Disallow: /orders');
  expect(rules).toContain('Sitemap: http://127.0.0.1:3100/sitemap.xml');
  await page.goto('/cart');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('order filters and account dropdown actions stay separate', async ({ page }, testInfo) => {
  const orders = [
    {
      id: '00000000-0000-4000-8000-000000000011',
      status: 'paid',
      total_minor: 85000,
      created_at: '2026-09-17T08:00:00Z',
      order_items: [{ name: 'The Everyday Mug', quantity: 1 }],
    },
    {
      id: '00000000-0000-4000-8000-000000000012',
      status: 'pending',
      total_minor: 65000,
      created_at: '2026-09-17T09:00:00Z',
      order_items: [{ name: 'Daily Notes', quantity: 1 }],
    },
  ];
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      json: { user: { id: 'user-1', email: 'test@example.com' }, configured: true },
    }),
  );
  await page.route('**/api/orders', (route) => route.fulfill({ json: { orders } }));
  await page.route('**/api/auth/logout', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto('/orders');
  await expect(page.locator('.order-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Paid', exact: true }).click();
  await expect(page.locator('.order-card')).toHaveCount(1);
  await expect(page.locator('.order-card')).toHaveAttribute(
    'href',
    '/orders/00000000-0000-4000-8000-000000000011',
  );
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search orders' }).fill('Daily Notes');
  await expect(page.locator('.order-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Account menu for test@example.com' }).click();
  await expect(page.locator('.account-dropdown-email')).toHaveText('test@example.com');
  await expect(page.getByRole('button', { name: 'Account menu for test@example.com' })).toHaveText(
    'TE',
  );
  await page.screenshot({ path: `artifacts/account-menu-${testInfo.project.name}.png` });
  await expect(page.locator('.account-dropdown')).not.toContainText('Your orders');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/$/);
});
