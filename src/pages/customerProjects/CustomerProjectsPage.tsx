import { useMemo, useState } from 'react'
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { SmartSelect } from '../../components/SmartSelect'
import {
  accountPeriodLabels,
  canManageFlow,
  canTransitionCustomerProjectStatus,
  createCustomerProjectId,
  customerProjectStatusLabels,
  customerProjectTypeLabels,
  platformBusinessNameLabels,
  settlementModeLabels,
  supplyContentTypeLabels,
  supplyTargetLabels,
} from '../../domain/helpers'
import {
  accountPeriodOptions,
  customerProjectNextStatusOptions,
  customerProjectStatusOptions,
  customerProjectTypeOptions,
  dealCycleOptions,
  defaultCustomerProjectSearchValues,
  defaultCustomerProjectValues,
  invoiceTypeOptions,
  platformBusinessNameOptions,
  settlementModeOptions,
  supplyContentTypeOptions,
  supplyTargetOptions,
} from '../../domain/formDefaults'
import { automakerOptions, brandOptions } from '../../domain/referenceData'
import { matchesSmartValue } from '../../domain/search'
import { useLeadSystemStore } from '../../domain/store'
import type {
  CustomerProject,
  CustomerProjectFormValues,
  CustomerProjectSearchValues,
  CustomerProjectStatus,
} from '../../domain/types'

const { Title, Text } = Typography

const booleanOptions = [
  { value: true, label: '是' },
  { value: false, label: '否' },
]

function CustomerProjectForm({
  form,
  initialProject,
  onFinish,
}: {
  form: ReturnType<typeof Form.useForm<CustomerProjectFormValues>>[0]
  initialProject: CustomerProject | null
  onFinish: (values: Omit<CustomerProjectFormValues, 'status'>) => void
}) {
  return (
    <Form layout="vertical" form={form} initialValues={defaultCustomerProjectValues} onFinish={onFinish}>
      <Title level={5}>项目基础信息</Title>
      <Form.Item label="客户名称" name="customerName" rules={[{ required: true, message: '请输入客户名称' }]}>
        <Input placeholder="下游客户 / 甲方名称" />
      </Form.Item>
      <div className="modal-form-grid">
        <Form.Item label="项目类型" name="projectType"><Select options={customerProjectTypeOptions} /></Form.Item>
        <Form.Item label="供给对象" name="supplyTarget"><Select options={supplyTargetOptions} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="主机厂" name="oemBrand"><SmartSelect options={[...automakerOptions, ...brandOptions]} placeholder="选择或手动添加主机厂/品牌" /></Form.Item>
        <Form.Item label="是否直播业务" name="isLiveBusiness"><Select options={booleanOptions} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="销售负责人" name="salesOwner"><Input /></Form.Item>
        <Form.Item label="运营负责人" name="operationOwner"><Input /></Form.Item>
      </div>
      <Form.Item label="项目状态"><Tag>{customerProjectStatusLabels[initialProject?.status ?? 'pending']}</Tag></Form.Item>

      <Title level={5}>业务与交付要求</Title>
      <div className="modal-form-grid">
        <Form.Item label="平台业务名称" name="platformBusinessName"><Select options={platformBusinessNameOptions} /></Form.Item>
        <Form.Item label="供给内容" name="supplyContentType"><Select options={supplyContentTypeOptions} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="需求量级" name="demandVolume"><Input placeholder="例如：3000条/月" /></Form.Item>
        <Form.Item label="推送时间" name="pushTime"><Input placeholder="例如：每日 10:00 / T+1" /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="是否要求首触" name="requiresFirstTouch"><Select options={booleanOptions} /></Form.Item>
        <Form.Item label="有效率要求" name="effectiveRateRequirement"><Input placeholder="例如：不低于 65%" /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="系统排重结果有效" name="systemDedupValid"><Select options={booleanOptions} /></Form.Item>
        <Form.Item label="推送是否成功" name="pushSuccess"><Select options={booleanOptions} /></Form.Item>
      </div>

      <Title level={5}>成交与到店要求</Title>
      <div className="modal-form-grid">
        <Form.Item label="支持精准下发" name="supportsPreciseDelivery"><Select options={booleanOptions} /></Form.Item>
        <Form.Item label="成交周期" name="dealCycle"><Select options={dealCycleOptions} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="需要成交凭证" name="requiresDealProof"><Select options={booleanOptions} /></Form.Item>
        <Form.Item label="成交凭证类型" name="dealProofType"><Input placeholder="图片 / 视频 / 其他" /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="需要到店录音" name="requiresArrivalRecording"><Select options={booleanOptions} /></Form.Item>
        <Form.Item label="需要到店凭证" name="requiresArrivalProof"><Select options={booleanOptions} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="确认系统到店" name="requiresSystemArrivalConfirm"><Select options={booleanOptions} /></Form.Item>
        <Form.Item label="成交单店要求" name="maxDealsPerStore"><Input placeholder="例如：不超过3单" /></Form.Item>
      </div>
      <Form.Item label="单店其他要求" name="storeRequirementNote"><Input.TextArea rows={2} /></Form.Item>

      <Title level={5}>合同、付款与结算</Title>
      <div className="modal-form-grid">
        <Form.Item label="是否已签合同" name="contractSigned"><Select options={booleanOptions} /></Form.Item>
        <Form.Item label="合同编号/说明" name="contractNo"><Input /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="首付款金额" name="downPaymentAmount"><Input type="number" min={0} /></Form.Item>
        <Form.Item label="首付款到账" name="downPaymentReceived"><Select options={booleanOptions} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="结算方式" name="settlementMode"><Select options={settlementModeOptions} /></Form.Item>
        <Form.Item label="账期" name="accountPeriod"><Select options={accountPeriodOptions} /></Form.Item>
      </div>
      <Form.Item label="发票形式" name="invoiceType"><Select options={invoiceTypeOptions} /></Form.Item>
      <div className="modal-form-grid">
        <Form.Item label="结算单价" name="unitPrice"><Input type="number" min={0} /></Form.Item>
        <Form.Item label="最终结算单价" name="finalUnitPrice"><Input type="number" min={0} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="最终结算比例" name="finalSettlementRatio"><Input type="number" min={0} step="0.01" /></Form.Item>
        <Form.Item label="最终结算总金额" name="finalSettlementAmount"><Input type="number" min={0} /></Form.Item>
      </div>
      <div className="modal-form-grid">
        <Form.Item label="结算标准" name="settlementStandard"><Input placeholder="客户给出数据为准 / 系统数据为准 / 双方确认" /></Form.Item>
        <Form.Item label="耗损比例" name="lossRatio"><Input type="number" min={0} step="0.01" /></Form.Item>
      </div>
      <Form.Item label="结算备注" name="settlementNote"><Input.TextArea rows={2} /></Form.Item>
      <Form.Item label="其他要求备注" name="requirementNote"><Input.TextArea rows={3} /></Form.Item>
    </Form>
  )
}

function CustomerProjectDetail({
  project,
  role,
  onClose,
  onTransition,
}: {
  project: CustomerProject | null
  role: ReturnType<typeof useLeadSystemStore.getState>['role']
  onClose: () => void
  onTransition: (project: CustomerProject, status: CustomerProjectStatus) => void
}) {
  return (
    <Drawer title="客户项目详情" open={Boolean(project)} onClose={onClose} size="large">
      {project ? (
        <Space orientation="vertical" size={16} className="page-stack">
          <Card className="lead-profile-card">
            <div className="lead-profile-head">
              <div>
                <Title level={3}>{project.customerName}</Title>
                <Text type="secondary">{customerProjectTypeLabels[project.projectType]} · {supplyTargetLabels[project.supplyTarget]} · {project.oemBrand || '未指定主机厂'}</Text>
              </div>
              <Tag color={project.status === 'settled' ? 'green' : project.status === 'paused' ? 'gold' : 'blue'}>{customerProjectStatusLabels[project.status]}</Tag>
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="平台业务">{platformBusinessNameLabels[project.platformBusinessName]}</Descriptions.Item>
              <Descriptions.Item label="供给内容">{supplyContentTypeLabels[project.supplyContentType]}</Descriptions.Item>
              <Descriptions.Item label="需求量级">{project.demandVolume || '-'}</Descriptions.Item>
              <Descriptions.Item label="推送时间">{project.pushTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="销售负责人">{project.salesOwner}</Descriptions.Item>
              <Descriptions.Item label="运营负责人">{project.operationOwner}</Descriptions.Item>
              <Descriptions.Item label="其他要求" span={2}>{project.requirementNote || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="业务规则">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="首触要求">{project.requiresFirstTouch ? '需要' : '不需要'}</Descriptions.Item>
              <Descriptions.Item label="有效率要求">{project.effectiveRateRequirement || '-'}</Descriptions.Item>
              <Descriptions.Item label="系统排重有效">{project.systemDedupValid ? '是' : '否'}</Descriptions.Item>
              <Descriptions.Item label="推送成功">{project.pushSuccess ? '是' : '否'}</Descriptions.Item>
              <Descriptions.Item label="精准下发">{project.supportsPreciseDelivery ? '支持' : '不支持'}</Descriptions.Item>
              <Descriptions.Item label="成交周期">{dealCycleOptions.find((item) => item.value === project.dealCycle)?.label}</Descriptions.Item>
              <Descriptions.Item label="成交凭证">{project.requiresDealProof ? project.dealProofType || '需要' : '不需要'}</Descriptions.Item>
              <Descriptions.Item label="到店凭证">{project.requiresArrivalProof ? '需要' : '不需要'}</Descriptions.Item>
              <Descriptions.Item label="到店录音">{project.requiresArrivalRecording ? '需要' : '不需要'}</Descriptions.Item>
              <Descriptions.Item label="系统到店确认">{project.requiresSystemArrivalConfirm ? '需要' : '不需要'}</Descriptions.Item>
              <Descriptions.Item label="单店要求">{project.maxDealsPerStore}</Descriptions.Item>
              <Descriptions.Item label="单店备注">{project.storeRequirementNote || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="合同与结算">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="合同">{project.contractSigned ? project.contractNo || '已签' : '未签'}</Descriptions.Item>
              <Descriptions.Item label="首付款">{project.downPaymentAmount.toLocaleString()} 元 / {project.downPaymentReceived ? '已到账' : '未到账'}</Descriptions.Item>
              <Descriptions.Item label="结算方式">{settlementModeLabels[project.settlementMode]}</Descriptions.Item>
              <Descriptions.Item label="账期">{accountPeriodLabels[project.accountPeriod]}</Descriptions.Item>
              <Descriptions.Item label="发票形式">{invoiceTypeOptions.find((item) => item.value === project.invoiceType)?.label}</Descriptions.Item>
              <Descriptions.Item label="结算标准">{project.settlementStandard}</Descriptions.Item>
              <Descriptions.Item label="结算单价">{project.unitPrice.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="最终单价">{project.finalUnitPrice.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="最终比例">{Math.round(project.finalSettlementRatio * 100)}%</Descriptions.Item>
              <Descriptions.Item label="最终总额">{project.finalSettlementAmount.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="耗损比例">{Math.round(project.lossRatio * 100)}%</Descriptions.Item>
              <Descriptions.Item label="结算备注">{project.settlementNote || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="风险提示">
            <Space wrap>
              {!project.downPaymentReceived ? <Tag color="red">首付款未到账</Tag> : null}
              {project.requiresDealProof ? <Tag color="orange">需要成交凭证</Tag> : null}
              {project.requiresArrivalProof ? <Tag color="orange">需要到店凭证</Tag> : null}
              {project.settlementStandard.includes('客户') ? <Tag color="purple">客户数据为准</Tag> : null}
              {project.lossRatio > 0 ? <Tag color="gold">耗损比例 {Math.round(project.lossRatio * 100)}%</Tag> : null}
            </Space>
            <div className="drawer-action-row">
              {(customerProjectNextStatusOptions[project.status] ?? []).map((status) => (
                <Button key={status} type={status === 'paused' ? 'default' : 'primary'} disabled={!canManageFlow(role)} onClick={() => onTransition(project, status)}>
                  流转为{customerProjectStatusLabels[status]}
                </Button>
              ))}
            </div>
          </Card>
        </Space>
      ) : null}
    </Drawer>
  )
}

export function CustomerProjectsPage() {
  const { message } = AntApp.useApp()
  const { role, customerProjects, setCustomerProjects } = useLeadSystemStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<CustomerProject | null>(null)
  const [detailProject, setDetailProject] = useState<CustomerProject | null>(null)
  const [searchValues, setSearchValues] = useState<CustomerProjectSearchValues>(defaultCustomerProjectSearchValues)
  const [form] = Form.useForm<CustomerProjectFormValues>()
  const [searchForm] = Form.useForm<CustomerProjectSearchValues>()
  const selectedDetailProject = detailProject
    ? customerProjects.find((project) => project.id === detailProject.id) ?? detailProject
    : null

  const filteredProjects = useMemo(() => {
    const keyword = searchValues.keyword.trim().toLowerCase()
    const oemBrand = searchValues.oemBrand.trim()
    return customerProjects.filter((project) => {
      const keywordMatched = keyword
        ? [project.customerName, project.salesOwner, project.operationOwner, project.requirementNote, project.settlementNote]
            .some((value) => value.toLowerCase().includes(keyword))
        : true
      return keywordMatched
        && (!searchValues.projectType || project.projectType === searchValues.projectType)
        && (!searchValues.supplyTarget || project.supplyTarget === searchValues.supplyTarget)
        && matchesSmartValue(project.oemBrand, oemBrand, [brandOptions, automakerOptions])
        && (!searchValues.status || project.status === searchValues.status)
    })
  }, [customerProjects, searchValues])

  const openCreate = () => {
    setEditingProject(null)
    form.setFieldsValue(defaultCustomerProjectValues)
    setModalOpen(true)
  }
  const openEdit = (project: CustomerProject) => {
    setEditingProject(project)
    form.setFieldsValue(project)
    setModalOpen(true)
  }
  const saveProject = (values: Omit<CustomerProjectFormValues, 'status'>) => {
    if (!canManageFlow(role)) {
      message.warning('当前角色不能编辑客户项目')
      return
    }
    const normalized = {
      ...values,
      status: editingProject?.status ?? 'pending',
      downPaymentAmount: Number(values.downPaymentAmount || 0),
      unitPrice: Number(values.unitPrice || 0),
      finalUnitPrice: Number(values.finalUnitPrice || 0),
      finalSettlementRatio: Number(values.finalSettlementRatio || 0),
      finalSettlementAmount: Number(values.finalSettlementAmount || 0),
      lossRatio: Number(values.lossRatio || 0),
    }
    if (editingProject) {
      setCustomerProjects((projects) => projects.map((project) => project.id === editingProject.id ? { ...project, ...normalized } : project))
      message.success('客户项目已保存')
    } else {
      setCustomerProjects((projects) => [{ id: createCustomerProjectId(projects.length), ...normalized }, ...projects])
      message.success('客户项目已新增')
    }
    setModalOpen(false)
    form.resetFields()
  }
  const transitionProject = (project: CustomerProject, status: CustomerProjectStatus) => {
    if (!canManageFlow(role)) {
      message.warning('当前角色不能流转客户项目状态')
      return
    }
    if (!canTransitionCustomerProjectStatus(project.status, status)) {
      message.warning('当前客户项目不能执行该状态流转')
      return
    }
    setCustomerProjects((projects) => projects.map((item) => item.id === project.id ? { ...item, status } : item))
    message.success(`客户项目已流转为：${customerProjectStatusLabels[status]}`)
  }
  const resetSearch = () => {
    setSearchValues(defaultCustomerProjectSearchValues)
    searchForm.setFieldsValue(defaultCustomerProjectSearchValues)
  }

  const columns: TableColumnsType<CustomerProject> = [
    {
      title: '客户项目', width: 220,
      render: (_, project) => <Space orientation="vertical" size={0}><Button type="link" className="table-link" onClick={() => setDetailProject(project)}>{project.customerName}</Button><Text type="secondary">{customerProjectTypeLabels[project.projectType]} · {supplyTargetLabels[project.supplyTarget]}</Text></Space>,
    },
    {
      title: '业务', width: 190,
      render: (_, project) => <Space orientation="vertical" size={2}><Text>{platformBusinessNameLabels[project.platformBusinessName]} / {supplyContentTypeLabels[project.supplyContentType]}</Text><Text type="secondary">{project.oemBrand || '未指定主机厂'}</Text></Space>,
    },
    { title: '需求量级', dataIndex: 'demandVolume', width: 130 },
    {
      title: '负责人', width: 150,
      render: (_, project) => <Space orientation="vertical" size={0}><Text>销售：{project.salesOwner}</Text><Text type="secondary">运营：{project.operationOwner}</Text></Space>,
    },
    {
      title: '合同/首付', width: 160,
      render: (_, project) => <Space wrap size={4}><Tag color={project.contractSigned ? 'green' : 'orange'}>{project.contractSigned ? '已签合同' : '未签合同'}</Tag><Tag color={project.downPaymentReceived ? 'green' : 'red'}>{project.downPaymentReceived ? '首付到账' : '首付未到账'}</Tag></Space>,
    },
    {
      title: '结算', width: 170,
      render: (_, project) => <Space orientation="vertical" size={2}><Text>{settlementModeLabels[project.settlementMode]} / {accountPeriodLabels[project.accountPeriod]}</Text><Text type="secondary">{project.finalSettlementAmount.toLocaleString()} 元</Text></Space>,
    },
    {
      title: '风险', width: 220,
      render: (_, project) => <Space wrap size={4}>{!project.downPaymentReceived ? <Tag color="red">首付款未到账</Tag> : null}{project.requiresDealProof ? <Tag color="orange">需成交凭证</Tag> : null}{project.requiresArrivalProof ? <Tag color="orange">需到店凭证</Tag> : null}{project.settlementStandard.includes('客户') ? <Tag color="purple">客户数据为准</Tag> : null}{project.lossRatio > 0 ? <Tag color="gold">耗损{Math.round(project.lossRatio * 100)}%</Tag> : null}</Space>,
    },
    {
      title: '状态', dataIndex: 'status', width: 110,
      render: (status: CustomerProjectStatus) => <Tag color={status === 'settled' ? 'green' : status === 'paused' ? 'gold' : status === 'completed' ? 'purple' : 'blue'}>{customerProjectStatusLabels[status]}</Tag>,
    },
    {
      title: '操作', width: 240,
      render: (_, project) => <Space wrap size={6}><Button size="small" onClick={() => openEdit(project)} disabled={!canManageFlow(role)}>编辑</Button>{(customerProjectNextStatusOptions[project.status] ?? []).map((status) => <Button key={status} size="small" type={status === 'paused' ? 'default' : 'primary'} ghost={status !== 'paused'} disabled={!canManageFlow(role)} onClick={() => transitionProject(project, status)}>{customerProjectStatusLabels[status]}</Button>)}</Space>,
    },
  ]

  return (
    <>
      <Space orientation="vertical" size={16} className="page-stack">
        <div className="page-title-row"><div><Title level={2}>客户项目管理</Title><Text type="secondary">销售接单后的下游客户项目工作台，管理合同、首付、业务要求、人员安排和结算规则。</Text></div><Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!canManageFlow(role)}>新增项目</Button></div>
        {!canManageFlow(role) ? <Alert type="info" message="当前角色仅可查看客户项目，不能新增、编辑或流转状态。" showIcon /> : null}
        <Card className="filter-card">
          <Form form={searchForm} layout="vertical" initialValues={defaultCustomerProjectSearchValues} onValuesChange={(_, values) => setSearchValues({ ...defaultCustomerProjectSearchValues, ...values })}>
            <div className="customer-project-filter-grid">
              <Form.Item label="关键词" name="keyword"><Input placeholder="客户名称 / 销售 / 运营 / 备注" allowClear /></Form.Item>
              <Form.Item label="项目类型" name="projectType"><Select allowClear placeholder="全部类型" options={customerProjectTypeOptions} /></Form.Item>
              <Form.Item label="供给对象" name="supplyTarget"><Select allowClear placeholder="全部对象" options={supplyTargetOptions} /></Form.Item>
              <Form.Item label="主机厂" name="oemBrand"><SmartSelect options={[...automakerOptions, ...brandOptions]} placeholder="问界 / wj / wenjie" /></Form.Item>
              <Form.Item label="状态" name="status"><Select allowClear placeholder="全部状态" options={customerProjectStatusOptions} /></Form.Item>
              <Form.Item label=" " className="filter-actions"><Space><Button onClick={resetSearch}>重置</Button><Tag color="blue">当前 {filteredProjects.length} 个</Tag></Space></Form.Item>
            </div>
          </Form>
        </Card>
        <Table rowKey="id" columns={columns} dataSource={filteredProjects} scroll={{ x: 1580 }} pagination={{ pageSize: 8 }} />
      </Space>
      <Modal title={editingProject ? '编辑客户项目' : '新增客户项目'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={860} destroyOnHidden>
        <CustomerProjectForm form={form} initialProject={editingProject} onFinish={saveProject} />
      </Modal>
      <CustomerProjectDetail project={selectedDetailProject} role={role} onClose={() => setDetailProject(null)} onTransition={transitionProject} />
    </>
  )
}
