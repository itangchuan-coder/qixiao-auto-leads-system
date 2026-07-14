import { expect, test, type Page } from '@playwright/test'

const coreRoutes = [
  ['/', '汽车销售线索工作台'],
  ['/personal-dashboard', '个人业务驾驶舱'],
  ['/customer-projects', '客户项目管理'],
  ['/quotations', '报价系统'],
  ['/leads', '线索管理'],
  ['/import', '线索导入'],
  ['/suppliers', '供应商管理'],
  ['/deal-base', '成交开拓基地'],
  ['/batches', '交付批次'],
  ['/targets', '交付对象'],
  ['/sop', '流程/SOP'],
  ['/permissions', '权限配置占位'],
] as const

function recordConsoleErrors(page: Page) {
  const errors: string[] = []

  page.on('console', (message) => {
    const text = message.text()
    if (message.type() === 'error' && !text.startsWith('Warning: [antd:')) errors.push(text)
  })

  page.on('pageerror', (error) => errors.push(error.message))

  return errors
}

test.describe('汽车销售线索管理系统', () => {
  for (const [path, heading] of coreRoutes) {
    test(`${path} renders its primary workspace`, async ({ page }) => {
      const consoleErrors = recordConsoleErrors(page)

      await page.goto(path)

      await expect(page).toHaveTitle('启效智联汽车销售线索管理系统')
      await expect(page.locator('#root')).not.toBeEmpty()
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expect(page.getByRole('menu')).toBeVisible()
      await expect(page.getByText('汽车销售线索管理系统')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('Internal Server Error')
      await expect(page.locator('body')).not.toContainText('Application error')
      expect(consoleErrors).toEqual([])
    })
  }
})
