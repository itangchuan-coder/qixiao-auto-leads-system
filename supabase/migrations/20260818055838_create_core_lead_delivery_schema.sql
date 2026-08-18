-- 启效智联：首个业务数据库底座。
-- 本迁移只创建结构、约束、RLS 和审计表；不会写入用户、组织或真实业务数据。

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'supervisor', 'operator', 'other')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

-- 所有用户均通过 organization_members 归属到组织。初始管理员由受控的后台流程创建，
-- 不允许客户端自行决定 organization_id 或角色。
create or replace function app_private.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select organization_id
  from public.organization_members
  where profile_id = (select auth.uid())
    and is_active = true
  order by created_at
  limit 1;
$$;

create or replace function app_private.has_any_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_members
    where profile_id = (select auth.uid())
      and organization_id = app_private.current_organization_id()
      and is_active = true
      and role = any(required_roles)
  );
$$;

revoke all on function app_private.current_organization_id() from public;
revoke all on function app_private.has_any_role(text[]) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.current_organization_id() to authenticated;
grant execute on function app_private.has_any_role(text[]) to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('L' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  name text not null,
  phone text not null,
  phone_normalized text not null,
  city text,
  interested_brand text,
  interested_model text,
  budget text,
  purchase_timeframe text not null default 'unknown' check (purchase_timeframe in ('within_7_days', 'within_30_days', 'within_90_days', 'unknown')),
  source text,
  status text not null default 'new' check (status in ('new', 'pending_clean', 'valid', 'duplicate', 'delivered', 'invalid')),
  owner_id uuid references public.profiles(id) on delete set null,
  note text not null default '',
  imported_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

create table public.lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  followed_at timestamptz not null default now(),
  operator_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_status_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('new', 'pending_clean', 'valid', 'duplicate', 'delivered', 'invalid')),
  reason text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.lead_import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('IMP' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  file_name text not null,
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_rows integer not null default 0 check (total_rows >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  duplicate_count integer not null default 0 check (duplicate_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

alter table public.leads
  add constraint leads_imported_batch_id_fkey
  foreign key (imported_batch_id) references public.lead_import_batches(id) on delete set null;

create table public.lead_import_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_batch_id uuid not null references public.lead_import_batches(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_payload jsonb not null default '{}'::jsonb,
  result text not null check (result in ('pending', 'imported', 'duplicate', 'failed')),
  error_message text,
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (import_batch_id, row_number)
);

create table public.delivery_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('T' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  name text not null,
  target_type text not null check (target_type in ('platform', 'oem')),
  contact text,
  phone text,
  status text not null default 'active' check (status in ('active', 'paused')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

create table public.delivery_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('B' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  target_id uuid not null references public.delivery_targets(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'delivered', 'reconciled')),
  note text not null default '',
  delivered_at timestamptz,
  reconciled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

create table public.delivery_batch_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  batch_id uuid not null references public.delivery_batches(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete restrict,
  sequence_no integer not null check (sequence_no > 0),
  created_at timestamptz not null default now(),
  unique (batch_id, lead_id),
  unique (batch_id, sequence_no)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('S' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  name text not null,
  supplier_type text not null check (supplier_type in ('channel', 'data')),
  contact text,
  phone text,
  contract_start date,
  contract_end date,
  payment_mode text not null check (payment_mode in ('prepaid', 'postpaid')),
  account_period text not null check (account_period in ('cash', '7_days', '15_days', '30_days', '45_days', '60_days')),
  status text not null default 'active' check (status in ('active', 'paused', 'terminated')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no),
  check (contract_end is null or contract_start is null or contract_end >= contract_start)
);

create table public.deal_base_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('D' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  city text,
  brand text,
  dealer text not null,
  contact text,
  phone text,
  position text,
  supply_model text,
  supply_content text,
  supply_proof text,
  supply_time timestamptz,
  is_valid boolean not null default false,
  payment_mode text not null check (payment_mode in ('prepaid', 'postpaid')),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  capacity text,
  owner_id uuid references public.profiles(id) on delete set null,
  payer_id uuid references public.profiles(id) on delete set null,
  payment_time timestamptz,
  status text not null default 'to_contact' check (status in ('to_contact', 'connected', 'available', 'reserved', 'delivered', 'success', 'failed')),
  is_success boolean not null default false,
  failure_reason text,
  company_bears_cost boolean not null default false,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

create table public.customer_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('P' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_name text not null,
  project_type text not null check (project_type in ('normal', 'platform', 'oem', 'live_base')),
  supply_target text not null check (supply_target in ('yiche', 'autohome', 'dongchedi', 'baidu_youjia', 'oem', 'live_base', 'other')),
  oem_brand text,
  is_live_business boolean not null default false,
  platform_business_name text not null check (platform_business_name in ('ka', 'youjia', 'cheshanghui', 'cpt', 'arrival', 'cps', 'live_lead', 'other')),
  supply_content_type text not null check (supply_content_type in ('lead', 'deal', 'arrival', 'live', 'other')),
  demand_volume text,
  push_time text,
  sales_owner_id uuid references public.profiles(id) on delete set null,
  operation_owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'completed', 'settled')),
  requires_first_touch boolean not null default false,
  effective_rate_requirement text,
  system_dedup_valid boolean not null default false,
  push_success boolean not null default false,
  supports_precise_delivery boolean not null default false,
  deal_cycle text not null default 'other' check (deal_cycle in ('t1', 't2', 't3', 't30', 'other')),
  requires_deal_proof boolean not null default false,
  deal_proof_type text,
  requires_arrival_recording boolean not null default false,
  requires_arrival_proof boolean not null default false,
  requires_system_arrival_confirm boolean not null default false,
  max_deals_per_store text,
  store_requirement_note text,
  contract_signed boolean not null default false,
  contract_no text,
  down_payment_amount numeric(14, 2) not null default 0 check (down_payment_amount >= 0),
  down_payment_received boolean not null default false,
  settlement_mode text not null check (settlement_mode in ('monthly', 'project')),
  account_period text not null check (account_period in ('cash', '7_days', '15_days', '30_days', '45_days', '60_days')),
  invoice_type text not null check (invoice_type in ('general_taxpayer', 'small_scale', 'private_transfer', 'other')),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  final_unit_price numeric(14, 2) not null default 0 check (final_unit_price >= 0),
  final_settlement_ratio numeric(5, 2) not null default 0 check (final_settlement_ratio between 0 and 100),
  final_settlement_amount numeric(14, 2) not null default 0 check (final_settlement_amount >= 0),
  settlement_standard text,
  loss_ratio numeric(5, 2) not null default 0 check (loss_ratio between 0 and 100),
  settlement_note text,
  requirement_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('Q' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_name text not null,
  demander text,
  demand_time timestamptz,
  city_scope text[] not null default '{}',
  car_brand text,
  car_model text,
  content_type text not null check (content_type in ('lead', 'arrival', 'deal', 'policy', 'other')),
  demand_volume text,
  target_price numeric(14, 2) not null default 0 check (target_price >= 0),
  needs_quotation boolean not null default true,
  requires_ping_an_policy boolean not null default false,
  supports_precise_delivery boolean not null default false,
  submission_method text not null check (submission_method in ('spreadsheet', 'link', 'qr_code', 'other')),
  can_qr_to_link_whitelist boolean not null default false,
  requires_verification_code boolean not null default false,
  requires_deal boolean not null default false,
  required_deal_ratio text,
  requires_arrival boolean not null default false,
  judgement_type text not null check (judgement_type in ('system', 'proof', 'customer', 'mixed')),
  judgement_standard text,
  upstream_quote_price numeric(14, 2) not null default 0 check (upstream_quote_price >= 0),
  upstream_capacity text,
  upstream_supplier text,
  owned_quote_price numeric(14, 2) not null default 0 check (owned_quote_price >= 0),
  owned_capacity text,
  owned_owner_id uuid references public.profiles(id) on delete set null,
  recommended_price numeric(14, 2) not null default 0 check (recommended_price >= 0),
  gross_margin numeric(14, 2) not null default 0,
  sales_owner_id uuid references public.profiles(id) on delete set null,
  operation_owner_id uuid references public.profiles(id) on delete set null,
  channel_owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'requirement_confirming', 'sourcing', 'quoted', 'won', 'lost', 'archived')),
  requirement_note text,
  quote_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

create table public.sop_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_no text not null default ('SOP' || to_char(now(), 'YYYYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title text not null,
  audience text not null check (audience in ('supervisor', 'operator', 'shared')),
  version text not null,
  summary text not null default '',
  content text not null default '',
  source_file_name text,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (organization_id, business_no)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('lead_import_batch', 'supplier', 'deal_base_record', 'customer_project', 'quotation', 'delivery_batch', 'sop_document')),
  entity_id uuid not null,
  bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  unique (bucket, storage_path)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create table public.customer_project_status_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.customer_projects(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('pending', 'active', 'paused', 'completed', 'settled')),
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.quotation_status_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('new', 'requirement_confirming', 'sourcing', 'quoted', 'won', 'lost', 'archived')),
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.deal_base_status_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deal_base_record_id uuid not null references public.deal_base_records(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('to_contact', 'connected', 'available', 'reserved', 'delivered', 'success', 'failed')),
  note text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index leads_phone_normalized_idx on public.leads (organization_id, phone_normalized);
create index leads_status_created_at_idx on public.leads (organization_id, status, created_at desc);
create index leads_owner_idx on public.leads (organization_id, owner_id);
create index lead_follow_ups_lead_time_idx on public.lead_follow_ups (lead_id, followed_at desc);
create index lead_status_events_lead_time_idx on public.lead_status_events (lead_id, changed_at desc);
create index delivery_batch_leads_lead_idx on public.delivery_batch_leads (lead_id);
create index delivery_batches_target_idx on public.delivery_batches (organization_id, target_id, created_at desc);
create index customer_projects_status_idx on public.customer_projects (organization_id, status, updated_at desc);
create index quotations_status_idx on public.quotations (organization_id, status, updated_at desc);
create index suppliers_status_idx on public.suppliers (organization_id, status, updated_at desc);
create index deal_base_status_idx on public.deal_base_records (organization_id, status, updated_at desc);
create index attachments_entity_idx on public.attachments (organization_id, entity_type, entity_id);
create index audit_logs_entity_idx on public.audit_logs (organization_id, entity_type, entity_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations', 'profiles', 'organization_members', 'leads', 'lead_follow_ups',
    'lead_import_batches', 'delivery_targets', 'delivery_batches', 'suppliers',
    'deal_base_records', 'customer_projects', 'quotations', 'sop_documents'
  ]
  loop
    execute format(
      'create trigger set_%1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

-- 所有业务数据表均先开启 RLS。角色判断在 app_private 下的安全函数中完成，
-- 以避免从 profiles/organization_members 读取自身时发生策略递归。
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'leads', 'lead_follow_ups', 'lead_status_events', 'lead_import_batches', 'lead_import_rows',
    'delivery_targets', 'delivery_batches', 'delivery_batch_leads', 'suppliers',
    'deal_base_records', 'deal_base_status_events', 'customer_projects', 'customer_project_status_events',
    'quotations', 'quotation_status_events', 'sop_documents', 'attachments', 'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %1$I on public.%2$I for select to authenticated using (organization_id = app_private.current_organization_id() and app_private.has_any_role(array[''admin'', ''supervisor'', ''operator'']))',
      'read_own_organization', table_name
    );
    if table_name <> 'audit_logs' then
      execute format(
        'create policy %1$I on public.%2$I for insert to authenticated with check (organization_id = app_private.current_organization_id() and app_private.has_any_role(array[''admin'', ''supervisor'', ''operator'']))',
        'create_in_own_organization', table_name
      );
      execute format(
        'create policy %1$I on public.%2$I for update to authenticated using (organization_id = app_private.current_organization_id() and app_private.has_any_role(array[''admin'', ''supervisor'', ''operator''])) with check (organization_id = app_private.current_organization_id() and app_private.has_any_role(array[''admin'', ''supervisor'', ''operator'']))',
        'update_in_own_organization', table_name
      );
      execute format(
        'create policy %1$I on public.%2$I for delete to authenticated using (organization_id = app_private.current_organization_id() and app_private.has_any_role(array[''admin'', ''supervisor'']))',
        'delete_in_own_organization', table_name
      );
    end if;
  end loop;
end;
$$;

drop policy "read_own_organization" on public.sop_documents;
create policy "read_sop_by_audience" on public.sop_documents
  for select to authenticated
  using (
    organization_id = app_private.current_organization_id()
    and (
      app_private.has_any_role(array['admin'])
      or (audience = 'supervisor' and app_private.has_any_role(array['supervisor']))
      or (audience = 'operator' and app_private.has_any_role(array['operator']))
      or audience = 'shared'
    )
  );

create policy "read_current_organization" on public.organizations
  for select to authenticated
  using (id = app_private.current_organization_id());

create policy "admin_update_current_organization" on public.organizations
  for update to authenticated
  using (id = app_private.current_organization_id() and app_private.has_any_role(array['admin']))
  with check (id = app_private.current_organization_id() and app_private.has_any_role(array['admin']));

create policy "read_profiles_in_own_organization" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (
      app_private.has_any_role(array['admin', 'supervisor', 'operator'])
      and exists (
      select 1 from public.organization_members member
      where member.profile_id = profiles.id
        and member.organization_id = app_private.current_organization_id()
      )
    )
  );

create policy "update_own_profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "read_own_memberships" on public.organization_members
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (organization_id = app_private.current_organization_id() and app_private.has_any_role(array['admin']))
  );

create policy "admin_create_memberships" on public.organization_members
  for insert to authenticated
  with check (organization_id = app_private.current_organization_id() and app_private.has_any_role(array['admin']));

create policy "admin_update_memberships" on public.organization_members
  for update to authenticated
  using (organization_id = app_private.current_organization_id() and app_private.has_any_role(array['admin']))
  with check (organization_id = app_private.current_organization_id() and app_private.has_any_role(array['admin']));

create policy "admin_delete_memberships" on public.organization_members
  for delete to authenticated
  using (organization_id = app_private.current_organization_id() and app_private.has_any_role(array['admin']));

-- audit_logs 没有客户端写入策略；后续由受控 RPC 或服务端写入，防止用户伪造审计记录。
