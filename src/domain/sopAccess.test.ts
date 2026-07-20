import { describe, expect, it } from 'vitest'
import { canPublishSop, getDownloadableSops } from './helpers'
import type { SopDocument } from './types'

const documents: SopDocument[] = [
  {
    id: 'SOP-OPERATOR',
    title: '运营岗位工作 SOP',
    audience: 'operator',
    version: 'v1.0',
    updatedAt: '2026-07-15 10:00',
    publishedBy: '主管',
    summary: '运营流程',
    content: '# 运营岗位工作 SOP',
    sourceFileName: 'operator-workflow.md',
  },
  {
    id: 'SOP-SUPERVISOR',
    title: '主管岗位管控 SOP',
    audience: 'supervisor',
    version: 'v1.0',
    updatedAt: '2026-07-15 10:00',
    publishedBy: '主管',
    summary: '主管流程',
    content: '# 主管岗位管控 SOP',
    sourceFileName: 'supervisor-governance.md',
  },
  {
    id: 'SOP-SHARED',
    title: '通用操作说明',
    audience: 'shared',
    version: 'v1.0',
    updatedAt: '2026-07-15 10:00',
    publishedBy: '主管',
    summary: '通用流程',
    content: '# 通用操作说明',
    sourceFileName: 'common-guide.md',
  },
]

describe('SOP 权限规则', () => {
  it('运营只能下载运营和通用 SOP', () => {
    expect(getDownloadableSops('operator', documents).map((document) => document.id)).toEqual([
      'SOP-OPERATOR',
      'SOP-SHARED',
    ])
  })

  it('主管可下载主管、运营和通用 SOP，并具备发布权限', () => {
    expect(getDownloadableSops('supervisor', documents)).toHaveLength(3)
    expect(canPublishSop('supervisor')).toBe(true)
  })

  it('其他角色只能下载通用 SOP，且不能发布', () => {
    expect(getDownloadableSops('other', documents).map((document) => document.id)).toEqual(['SOP-SHARED'])
    expect(canPublishSop('other')).toBe(false)
  })
})
