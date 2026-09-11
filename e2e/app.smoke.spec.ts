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

async function chooseVisibleSelectOption(page: Page, label: string) {
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText(label, { exact: true }).click()
}

async function navigateFromMenu(page: Page, label: RegExp) {
  const menuItem = page.getByRole('menuitem', { name: label })
  if (!await menuItem.isVisible()) await page.locator('.ant-layout-sider-zero-width-trigger').click()
  await menuItem.click()
}

test.describe('汽车销售线索管理系统', () => {
  test('provides a dedicated password-reset completion page', async ({ page }) => {
    await page.goto('/reset-password')

    await expect(page.getByRole('heading', { name: '设置新密码' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: '新密码', exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: '确认新密码', exact: true })).toBeVisible()
  })

  test('replaces the login form with the password-reset request form', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: '忘记密码？' }).click()
    await expect(page.getByRole('heading', { name: '发送密码重置邮件' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '登录工作台' })).toHaveCount(0)
    await expect(page.getByLabel('企业邮箱')).toBeVisible()
    await expect(page.getByRole('button', { name: '返回登录' })).toBeVisible()
  })

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

  test('loads the Excel writer only after lead export is requested', async ({ page }) => {
    const workbookRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('xlsx')) workbookRequests.push(request.url())
    })

    await page.goto('/leads')
    await expect(page.getByRole('heading', { name: '线索管理' })).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(workbookRequests).toEqual([])

    await page.getByRole('checkbox', { name: 'Select row 1' }).check()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: '导出所选' }).click()
    await expect((await download).suggestedFilename()).toBe('汽车销售线索导出.xlsx')
    expect(workbookRequests.length).toBeGreaterThan(0)
  })

  test('keeps the desktop application shell styled and aligned', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop shell geometry is covered by the desktop project.')

    await page.goto('/')
    await expect(page.locator('.app-sider')).toBeVisible()
    await expect(page.locator('.app-header')).toBeVisible()
    const layout = await page.evaluate(() => {
      const sider = document.querySelector<HTMLElement>('.app-sider')
      const header = document.querySelector<HTMLElement>('.app-header')
      const content = document.querySelector<HTMLElement>('.app-content')

      if (!sider || !header || !content) throw new Error('Application shell is missing.')

      return {
        siderWidth: Math.round(sider.getBoundingClientRect().width),
        headerPosition: window.getComputedStyle(header).position,
        siderBackground: window.getComputedStyle(sider).backgroundColor,
        contentPaddingLeft: window.getComputedStyle(content).paddingLeft,
      }
    })

    expect(layout.siderWidth).toBe(248)
    expect(layout.headerPosition).toBe('sticky')
    expect(layout.siderBackground).not.toBe('rgb(0, 21, 41)')
    expect(layout.contentPaddingLeft).toBe('24px')
    await page.screenshot({ path: testInfo.outputPath('desktop-shell.png'), fullPage: false })
  })

  test('does not allow an edit form to bypass lead status transitions', async ({ page }) => {
    await page.goto('/leads')

    const deliveredRow = page.locator('tr', { hasText: '周先生' })
    await deliveredRow.getByRole('button', { name: '编辑' }).click()

    await expect(page.getByRole('dialog', { name: '编辑线索' }).getByText('状态')).toHaveCount(0)
  })

  test('keeps other-role users from selecting or exporting lead data', async ({ page }) => {
    await page.goto('/leads')
    await page.locator('.role-select').click()
    await chooseVisibleSelectOption(page, '其他角色')

    await expect(page.getByText('138****8001').first()).toBeVisible()
    await expect(page.getByText('13800138001')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '导出所选' })).toBeDisabled()
    await expect(page.locator('tbody .ant-checkbox-input').first()).toBeDisabled()
  })

  test('preserves administrator and operator access while masking other-role phones', async ({ page }) => {
    await page.goto('/leads')
    const chenRow = page.locator('tr', { hasText: '陈先生' })

    await expect(chenRow.getByText('13800138001')).toBeVisible()
    await expect(chenRow.getByRole('button', { name: '编辑' })).toBeEnabled()
    await chenRow.locator('.ant-checkbox-input').check()

    await page.locator('.role-select').click()
    await chooseVisibleSelectOption(page, '运营')
    await expect(chenRow.getByText('13800138001')).toBeVisible()
    await expect(chenRow.getByRole('button', { name: '编辑' })).toBeEnabled()

    await page.locator('.role-select').click()
    await chooseVisibleSelectOption(page, '其他角色')
    await expect(chenRow.getByText('138****8001')).toBeVisible()
    await expect(chenRow.getByRole('button', { name: '编辑' })).toBeDisabled()
  })

  test('creates and saves a lead with SmartSelect choices', async ({ page }) => {
    await page.goto('/leads')
    await page.getByRole('button', { name: '新增线索' }).click()
    const dialog = page.getByRole('dialog', { name: '新增线索' })

    await dialog.getByLabel('客户姓名').fill('回归客户')
    await dialog.getByLabel('手机号').fill('13500135006')
    const citySelect = dialog.locator('.ant-select').nth(0)
    await citySelect.click()
    await citySelect.locator('input').fill('sh')
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: /^上海 sh$/ }).click()
    const brandSelect = dialog.locator('.ant-select').nth(1)
    await brandSelect.click()
    await brandSelect.locator('input').fill('wj')
    await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').filter({ hasText: /^问界 wj$/ }).click()
    await dialog.getByLabel('来源').fill('UI 回归')
    await dialog.locator('.ant-modal-footer .ant-btn-primary').click()

    const createdRow = page.locator('tr', { hasText: '回归客户' })
    await expect(createdRow).toContainText('问界')
    await createdRow.getByRole('button', { name: '编辑' }).click()
    const editDialog = page.getByRole('dialog', { name: '编辑线索' })
    await expect(editDialog.locator('.ant-select').nth(0)).toContainText('上海')
    await editDialog.getByLabel('备注').fill('已由 UI 回归保存')
    await editDialog.locator('.ant-modal-footer .ant-btn-primary').click()
    await expect(page.locator('tr', { hasText: '回归客户' })).toBeVisible()
  })

  test('creates a delivery batch only for valid selected leads', async ({ page }) => {
    await page.goto('/leads')
    await page.locator('tr', { hasText: '陈先生' }).locator('.ant-checkbox-input').check()
    await navigateFromMenu(page, /交付批次/)
    await page.getByRole('button', { name: '创建批次' }).click()
    const dialog = page.getByRole('dialog', { name: '创建交付批次' })
    await dialog.getByLabel('交付对象').click()
    await chooseVisibleSelectOption(page, '华南新能源线索平台')
    await dialog.getByLabel('批次备注').fill('有效线索 UI 回归')
    await dialog.locator('.ant-modal-footer .ant-btn-primary').click()
    await expect(page.getByText('交付批次已创建，所选线索状态已更新为已交付')).toBeVisible()

    await navigateFromMenu(page, /线索管理/)
    await expect(page.locator('tr', { hasText: '陈先生' })).toContainText('已交付')
  })

  test('rejects a delivery batch containing a non-valid lead', async ({ page }) => {
    await page.goto('/leads')
    await page.locator('tr', { hasText: '李女士' }).locator('.ant-checkbox-input').check()
    await navigateFromMenu(page, /交付批次/)
    await page.getByRole('button', { name: '创建批次' }).click()
    const dialog = page.getByRole('dialog', { name: '创建交付批次' })
    await dialog.getByLabel('交付对象').click()
    await chooseVisibleSelectOption(page, '华南新能源线索平台')
    await dialog.locator('.ant-modal-footer .ant-btn-primary').click()

    await expect(page.getByText('交付批次仅可包含有效线索，请重新选择')).toBeVisible()
    await expect(page.getByRole('dialog', { name: '创建交付批次' })).toBeVisible()
  })

  test('does not expose illegal terminal-state reversions in workflow details', async ({ page }) => {
    await page.goto('/leads')
    await page.getByRole('button', { name: '周先生' }).click()
    await expect(page.getByRole('dialog', { name: '线索详情' }).getByRole('button', { name: /流转为/ })).toHaveCount(0)

    await page.goto('/quotations')
    await page.getByRole('button', { name: '易车华东 KA 询价' }).click()
    const quotationDrawer = page.getByRole('dialog', { name: '报价需求详情' })
    await quotationDrawer.getByRole('button', { name: '流转为已中标' }).click()
    await quotationDrawer.getByRole('button', { name: '流转为已归档' }).click()
    await expect(quotationDrawer.getByRole('button', { name: /流转为/ })).toHaveCount(0)

    await page.goto('/customer-projects')
    await page.getByRole('button', { name: '华南直播基地线索供量' }).click()
    const projectDrawer = page.getByRole('dialog', { name: '客户项目详情' })
    await projectDrawer.getByRole('button', { name: '流转为已结算' }).click()
    await expect(projectDrawer.getByRole('button', { name: /流转为/ })).toHaveCount(0)

    await page.goto('/deal-base')
    await page.getByRole('button', { name: '成都高新比亚迪王朝店' }).click()
    await expect(page.getByRole('dialog', { name: '成交产能详情' }).getByRole('button', { name: /流转为/ })).toHaveCount(0)
  })

  test('opens and refreshes core workflows without console errors or mobile body overflow', async ({ page }, testInfo) => {
    const consoleErrors = recordConsoleErrors(page)
    const routes = [
      ['/', '汽车销售线索工作台'],
      ['/leads', '线索管理'],
      ['/customer-projects', '客户项目管理'],
    ] as const

    for (const [path, heading] of routes) {
      await page.goto(path)
      await page.reload()
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath(`${heading}.png`), fullPage: true })
    }

    if (testInfo.project.name === 'chromium-mobile') {
      const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }))
      expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
      await expect(page.getByRole('button', { name: '新增项目' })).toBeVisible()
    }

    expect(consoleErrors).toEqual([])
  })
})
