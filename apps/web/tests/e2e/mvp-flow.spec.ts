import { test, expect } from '@playwright/test'

test('search landmark, open detail, wishlist persists after refresh', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('搜索国家/城市/地标').fill('Eiffel')
  await expect(page.getByRole('button', { name: 'Eiffel Tower' })).toBeVisible()

  await page.getByRole('button', { name: 'Eiffel Tower' }).click()
  await expect(page.getByRole('heading', { name: '埃菲尔铁塔' })).toBeVisible()

  await page.getByRole('button', { name: '收藏想去' }).click()
  await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()

  await page.reload()
  await page.getByPlaceholder('搜索国家/城市/地标').fill('Eiffel')
  await page.getByRole('button', { name: 'Eiffel Tower' }).click()

  await expect(page.getByRole('button', { name: '取消收藏' })).toBeVisible()
})
