import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: '仅支持 POST' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = request.headers.get('Authorization')
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) return json({ error: '服务未正确配置或请求未登录' }, 401)

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) return json({ error: '登录已失效' }, 401)

  const { data: membership, error: membershipError } = await callerClient.from('organization_members').select('organization_id, role').eq('profile_id', callerData.user.id).eq('role', 'admin').eq('is_active', true).maybeSingle()
  if (membershipError || !membership) return json({ error: '只有组织超级管理员可以重置密码' }, 403)

  const body = await request.json() as { email?: string; temporaryPassword?: string }
  const email = body.email?.trim().toLowerCase()
  const temporaryPassword = body.temporaryPassword
  if (!email || !temporaryPassword || temporaryPassword.length < 8) return json({ error: '邮箱或临时密码不符合要求' }, 400)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) return json({ error: '无法查找目标用户' }, 500)
  const target = usersData.users.find((user) => user.email?.toLowerCase() === email)
  if (!target) return json({ error: '该邮箱没有对应的系统用户' }, 404)

  const { data: targetMembership, error: targetMembershipError } = await adminClient.from('organization_members').select('id').eq('organization_id', membership.organization_id).eq('profile_id', target.id).eq('is_active', true).maybeSingle()
  if (targetMembershipError || !targetMembership) return json({ error: '目标用户不属于当前组织' }, 403)

  const { error: updateError } = await adminClient.auth.admin.updateUserById(target.id, { password: temporaryPassword })
  if (updateError) return json({ error: '重置密码失败' }, 500)
  return json({ ok: true })
})
