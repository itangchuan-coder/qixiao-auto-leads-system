alter table public.leads
  add column owner_label text not null default '';

comment on column public.leads.owner_label is
  '负责人显示名称；人员主数据完善前兼容现有自由文本负责人字段。';
