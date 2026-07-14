import { Card, List, Tag, Typography } from 'antd'
import { PageScaffold } from '../workflows/PageScaffold'

const { Paragraph } = Typography
const items = [
  ['线索导入', '上传文件后确认模拟导入结果，重复记录进入重复线索状态。'],
  ['线索清洗与交付', '完成状态流转后，在交付批次中选择有效线索并指定交付对象。'],
  ['客户项目与报价', '先建客户项目，再记录需求、报价和履约风险。'],
  ['供应商与成交产能', '维护合作档案、付款方式和成交结果，及时处理预付风险。'],
]
export default function SopPage() { return <PageScaffold title="流程/SOP" description="查看当前原型支持的核心操作流程和注意事项。"><Card><List dataSource={items} renderItem={([title, content]) => <List.Item><List.Item.Meta title={<><Tag color="blue">流程</Tag>{title}</>} description={<Paragraph>{content}</Paragraph>} /></List.Item>} /></Card></PageScaffold> }
