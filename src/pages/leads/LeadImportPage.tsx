import { App as AntApp, Alert, Card, Space, Upload } from 'antd'
import { CloudUploadOutlined } from '@ant-design/icons'
import { canManageFlow, createLeadId } from '../../domain/helpers'
import { useLeadSystemStore } from '../../domain/store'
import type { Lead } from '../../domain/types'
import { PageScaffold } from '../workflows/PageScaffold'

export default function LeadImportPage() {
  const { message } = AntApp.useApp()
  const role = useLeadSystemStore((state) => state.role)
  const leads = useLeadSystemStore((state) => state.leads)
  const setLeads = useLeadSystemStore((state) => state.setLeads)
  const simulateImport = () => {
    if (!canManageFlow(role)) { message.warning('当前角色不能导入线索'); return false }
    const imported: Lead[] = [
      { id: createLeadId(leads.length + 1), name: '孙先生', phone: '13500135006', city: '南京', interestedBrand: '蔚来', interestedModel: 'ES6', budget: '30-40万', purchaseTimeframe: 'within_30_days', source: 'Excel导入', status: 'pending_clean', createdAt: '2026-07-07 16:00', owner: '运营A', note: '模拟导入：等待清洗。', followUps: [] },
      { id: createLeadId(leads.length + 2), name: '重复样例', phone: leads[0]?.phone ?? '13800138001', city: '上海', interestedBrand: '问界', interestedModel: 'M9', budget: '40-50万', purchaseTimeframe: 'within_30_days', source: 'Excel导入', status: 'duplicate', createdAt: '2026-07-07 16:01', owner: '运营A', note: '模拟导入：手机号重复。', followUps: [] },
    ]
    setLeads((current) => [...imported, ...current])
    message.success('模拟导入完成：成功 1 条，重复 1 条，失败 0 条')
    return false
  }
  return <PageScaffold title="线索导入" description="上传 Excel 后执行模拟解析、重复识别和待清洗标记。">
    <Alert type="info" showIcon message="当前原型不读取真实 Excel 内容，上传任意文件将生成一条待清洗和一条重复样例。" />
    <Card><Space orientation="vertical" size={16} className="page-stack"><Upload.Dragger beforeUpload={simulateImport} showUploadList={false}><p className="ant-upload-drag-icon"><CloudUploadOutlined /></p><p>点击或拖拽文件到此区域导入</p></Upload.Dragger></Space></Card>
  </PageScaffold>
}
