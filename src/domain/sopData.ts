import operatorWorkflowContent from '../../docs/sop/operator-workflow.md?raw'
import supervisorGovernanceContent from '../../docs/sop/supervisor-governance.md?raw'
import type { SopDocument } from './types'

const sharedGuideContent = `# 通用系统操作与权限说明

## 适用范围

适用于需要查阅项目、线索、供应商或交付信息的其他角色。

## 操作要求

1. 仅查看与岗位相关的信息，手机号等敏感信息按当前角色脱敏展示。
2. 发现数据异常时，通过既定业务渠道通知运营或主管，不直接修改业务状态。
3. 下载后的 SOP 仅用于内部业务执行，不得外传。
`

export const initialSopDocuments: SopDocument[] = [
  {
    id: 'SOP-OPERATOR-V1',
    title: '运营岗位工作 SOP',
    audience: 'operator',
    version: 'v1.0',
    updatedAt: '2026-07-15 10:00',
    publishedBy: '主管',
    summary: '覆盖线索录入、项目执行、供应商维护与费用事项留痕。',
    content: operatorWorkflowContent,
    sourceFileName: 'operator-workflow.md',
  },
  {
    id: 'SOP-SUPERVISOR-V1',
    title: '主管岗位管控 SOP',
    audience: 'supervisor',
    version: 'v1.0',
    updatedAt: '2026-07-15 10:00',
    publishedBy: '主管',
    summary: '覆盖项目准入、交付复核、供应商管控与费用授权。',
    content: supervisorGovernanceContent,
    sourceFileName: 'supervisor-governance.md',
  },
  {
    id: 'SOP-SHARED-V1',
    title: '通用系统操作与权限说明',
    audience: 'shared',
    version: 'v1.0',
    updatedAt: '2026-07-15 10:00',
    publishedBy: '主管',
    summary: '说明查阅权限、敏感信息处理和异常上报要求。',
    content: sharedGuideContent,
    sourceFileName: 'common-system-guide.md',
  },
]
