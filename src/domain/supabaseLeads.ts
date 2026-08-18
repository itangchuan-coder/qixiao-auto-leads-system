import type { Lead, LeadFormValues, LeadStatus, FollowUpRecord } from './types'
import { supabase } from '../lib/supabase'

type RemoteFollowUp = {
  id: string
  content: string
  followed_at: string
  operator?: { display_name: string } | null
}

type RemoteLead = {
  id: string
  name: string
  phone: string
  city: string | null
  interested_brand: string | null
  interested_model: string | null
  budget: string | null
  purchase_timeframe: Lead['purchaseTimeframe']
  source: string | null
  status: LeadStatus
  owner_label: string | null
  note: string | null
  created_at: string
  lead_follow_ups?: RemoteFollowUp[]
}

const formatTimestamp = (value: string) => new Date(value).toLocaleString('sv-SE', { hour12: false }).replace('T', ' ')

export const normalizePhone = (phone: string) => phone.replace(/\D/g, '')

export function mapRemoteLead(row: RemoteLead): Lead {
  const followUps: FollowUpRecord[] = (row.lead_follow_ups ?? [])
    .map((item) => ({
      id: item.id,
      time: formatTimestamp(item.followed_at),
      operator: item.operator?.display_name ?? '系统用户',
      content: item.content,
    }))
    .sort((a, b) => b.time.localeCompare(a.time))

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    city: row.city ?? '',
    interestedBrand: row.interested_brand ?? '',
    interestedModel: row.interested_model ?? '',
    budget: row.budget ?? '',
    purchaseTimeframe: row.purchase_timeframe,
    source: row.source ?? '',
    status: row.status,
    createdAt: formatTimestamp(row.created_at),
    owner: row.owner_label ?? '',
    note: row.note ?? '',
    followUps,
  }
}

function client() {
  if (!supabase) throw new Error('Supabase 尚未配置')
  return supabase
}

async function currentUserAndOrganization() {
  const database = client()
  const { data: userData, error: userError } = await database.auth.getUser()
  if (userError) throw userError
  if (!userData.user) throw new Error('登录已失效，请重新登录')

  const { data: membership, error: membershipError } = await database
    .from('organization_members')
    .select('organization_id')
    .eq('profile_id', userData.user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (membershipError) throw membershipError
  if (!membership) throw new Error('当前账号尚未加入组织，请联系管理员')

  return { userId: userData.user.id, organizationId: membership.organization_id }
}

export async function fetchRemoteLeads() {
  const { data, error } = await client()
    .from('leads')
    .select('id,name,phone,city,interested_brand,interested_model,budget,purchase_timeframe,source,status,owner_label,note,created_at,lead_follow_ups(id,content,followed_at,operator:profiles!lead_follow_ups_operator_id_fkey(display_name))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as RemoteLead[]).map(mapRemoteLead)
}

export async function createRemoteLead(values: LeadFormValues, status: LeadStatus) {
  const { userId, organizationId } = await currentUserAndOrganization()
  const { error } = await client().from('leads').insert({
    organization_id: organizationId,
    name: values.name,
    phone: values.phone,
    phone_normalized: normalizePhone(values.phone),
    city: values.city,
    interested_brand: values.interestedBrand,
    interested_model: values.interestedModel,
    budget: values.budget,
    purchase_timeframe: values.purchaseTimeframe,
    source: values.source,
    status,
    owner_label: values.owner,
    note: values.note,
    created_by: userId,
  })
  if (error) throw error
}

export async function updateRemoteLead(id: string, values: LeadFormValues) {
  const { error } = await client().from('leads').update({
    name: values.name,
    phone: values.phone,
    phone_normalized: normalizePhone(values.phone),
    city: values.city,
    interested_brand: values.interestedBrand,
    interested_model: values.interestedModel,
    budget: values.budget,
    purchase_timeframe: values.purchaseTimeframe,
    source: values.source,
    owner_label: values.owner,
    note: values.note,
  }).eq('id', id)
  if (error) throw error
}

export async function addRemoteFollowUp(leadId: string, content: string) {
  const { userId, organizationId } = await currentUserAndOrganization()
  const { error } = await client().from('lead_follow_ups').insert({
    organization_id: organizationId,
    lead_id: leadId,
    content,
    operator_id: userId,
  })
  if (error) throw error
}

export async function transitionRemoteLead(lead: Lead, status: LeadStatus, operator: string) {
  const { userId, organizationId } = await currentUserAndOrganization()
  const database = client()
  const description = `状态从“${lead.status}”流转为“${status}”。`
  const { error: leadError } = await database.from('leads').update({ status }).eq('id', lead.id)
  if (leadError) throw leadError
  const { error: eventError } = await database.from('lead_status_events').insert({
    organization_id: organizationId,
    lead_id: lead.id,
    from_status: lead.status,
    to_status: status,
    changed_by: userId,
  })
  if (eventError) throw eventError
  const { error: followUpError } = await database.from('lead_follow_ups').insert({
    organization_id: organizationId,
    lead_id: lead.id,
    content: `${operator}：${description}`,
    operator_id: userId,
  })
  if (followUpError) throw followUpError
}
