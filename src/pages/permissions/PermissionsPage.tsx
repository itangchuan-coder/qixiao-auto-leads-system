import { Alert, Card, Descriptions, Tag } from 'antd'
import { PageScaffold } from '../workflows/PageScaffold'

export default function PermissionsPage() { return <PageScaffold title="权限配置占位" description="当前前端原型以角色切换演示可见手机号、编辑和流程操作权限。"><Alert type="info" showIcon message="管理员和运营角色可执行流程操作；其他角色只能查看脱敏信息。" /><Card><Descriptions bordered column={1}><Descriptions.Item label="管理员"><Tag color="green">完整权限</Tag> 查看完整手机号、编辑档案、状态流转、导入和交付。</Descriptions.Item><Descriptions.Item label="运营"><Tag color="blue">流程权限</Tag> 查看完整手机号、编辑线索并执行运营流程。</Descriptions.Item><Descriptions.Item label="其他角色"><Tag>受限查看</Tag> 手机号脱敏，不能编辑或流转。</Descriptions.Item></Descriptions></Card></PageScaffold> }
