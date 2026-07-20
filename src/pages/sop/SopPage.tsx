import { useState } from 'react'
import { Alert, App as AntApp, Button, Card, Form, Input, List, Modal, Select, Space, Tag, Typography, Upload } from 'antd'
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { canPublishSop, createSopId, getDownloadableSops, roleLabels } from '../../domain/helpers'
import { useLeadSystemStore } from '../../domain/store'
import type { SopAudience, SopDocument } from '../../domain/types'
import { PageScaffold } from '../workflows/PageScaffold'

const { Paragraph } = Typography
const audienceLabels: Record<SopAudience, string> = {
  supervisor: '主管',
  operator: '运营',
  shared: '全员',
}

type SopPublishFormValues = {
  title: string
  audience: SopAudience
  version: string
}

function downloadSop(document: SopDocument) {
  const blob = new Blob([document.content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = document.sourceFileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function SopPage() {
  const { message } = AntApp.useApp()
  const { role, sopDocuments, setSopDocuments } = useLeadSystemStore()
  const [form] = Form.useForm<SopPublishFormValues>()
  const [publishOpen, setPublishOpen] = useState(false)
  const [uploadedContent, setUploadedContent] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const downloadableDocuments = getDownloadableSops(role, sopDocuments)

  const publish = (values: SopPublishFormValues) => {
    if (!canPublishSop(role)) { message.warning('当前角色不能发布 SOP'); return }
    if (!uploadedContent || !uploadedFileName) { message.warning('请先上传 Markdown 或文本版 SOP 文件'); return }

    const document: SopDocument = {
      id: createSopId(sopDocuments.length),
      title: values.title,
      audience: values.audience,
      version: values.version,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      publishedBy: roleLabels[role],
      summary: `由${roleLabels[role]}发布，文件：${uploadedFileName}`,
      content: uploadedContent,
      sourceFileName: uploadedFileName,
    }
    setSopDocuments((current) => [document, ...current])
    setUploadedContent('')
    setUploadedFileName('')
    form.resetFields()
    setPublishOpen(false)
    message.success('SOP 已发布，并已按适用角色展示')
  }

  return (
    <PageScaffold
      title="流程/SOP"
      description="按当前角色下载可执行 SOP；主管可上传并发布新版文档。"
      actions={canPublishSop(role) ? <Button type="primary" icon={<UploadOutlined />} onClick={() => setPublishOpen(true)}>上传发布</Button> : null}
    >
      <Alert showIcon type="info" message={`当前角色：${roleLabels[role]}，可下载 ${downloadableDocuments.length} 份 SOP。`} />
      <Card>
        <List
          dataSource={downloadableDocuments}
          locale={{ emptyText: '当前角色暂无可下载 SOP' }}
          renderItem={(document) => (
            <List.Item actions={[<Button key="download" type="link" icon={<DownloadOutlined />} onClick={() => { downloadSop(document); message.success(`已开始下载：${document.sourceFileName}`) }}>下载</Button>]}>
              <List.Item.Meta
                title={<Space wrap><Tag color={document.audience === 'supervisor' ? 'purple' : document.audience === 'operator' ? 'blue' : 'green'}>{audienceLabels[document.audience]}</Tag><span>{document.title}</span><Tag>{document.version}</Tag></Space>}
                description={<><Paragraph>{document.summary}</Paragraph><Typography.Text type="secondary">发布人：{document.publishedBy}　更新时间：{document.updatedAt}　文件：{document.sourceFileName}</Typography.Text></>}
              />
            </List.Item>
          )}
        />
      </Card>
      <Modal open={publishOpen} title="上传并发布 SOP" onCancel={() => setPublishOpen(false)} onOk={() => form.submit()} destroyOnHidden>
        <Form form={form} layout="vertical" initialValues={{ audience: 'shared', version: 'v1.0' }} onFinish={publish}>
          <Form.Item name="title" label="SOP 名称" rules={[{ required: true, message: '请输入 SOP 名称' }]}><Input placeholder="例如：运营费用申请 SOP" /></Form.Item>
          <div className="modal-form-grid">
            <Form.Item name="audience" label="适用角色"><Select options={Object.entries(audienceLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
            <Form.Item name="version" label="版本号" rules={[{ required: true, message: '请输入版本号' }]}><Input placeholder="例如：v1.1" /></Form.Item>
          </div>
          <Form.Item label="SOP 文件" required extra="仅支持 Markdown 或文本文件；发布后当前会话内立即生效。">
            <Upload
              accept=".md,.txt,text/markdown,text/plain"
              maxCount={1}
              beforeUpload={async (file) => {
                setUploadedContent(await file.text())
                setUploadedFileName(file.name)
                return false
              }}
              onRemove={() => { setUploadedContent(''); setUploadedFileName('') }}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </PageScaffold>
  )
}
