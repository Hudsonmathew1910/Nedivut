-- Nedivut Charitable Trust website: initial schema.
-- Run in the Supabase SQL editor (or `supabase db push`).
--
-- Access model: every table has RLS enabled. The public (anon) role can only
-- read approved impact metrics and active donation purposes. All writes go
-- through the website's server code using the service-role key, which never
-- reaches the browser. Staff use the Supabase dashboard until an admin portal
-- is built.

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor       text not null default coalesce(auth.uid()::text, current_user),
  entity      text not null,
  entity_id   text not null,
  action      text not null,
  detail      jsonb
);
alter table public.audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window, shared across serverless instances)
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;

create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ws timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c  int;
begin
  insert into rate_limits (key, window_start) values (p_key, ws)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into c;
  delete from rate_limits where window_start < now() - interval '1 day';
  return c <= p_max;
end $$;

-- ---------------------------------------------------------------------------
-- Enquiries (contact form)
-- ---------------------------------------------------------------------------
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text,
  phone       text,
  category    text not null,
  message     text not null,
  consent     boolean not null,
  status      text not null default 'new' check (status in ('new','in_progress','responded','closed','spam')),
  assignee    text,
  notes       text
);
alter table public.enquiries enable row level security;

-- ---------------------------------------------------------------------------
-- Education support requests
-- ---------------------------------------------------------------------------
create table if not exists public.support_requests (
  id                     uuid primary key default gen_random_uuid(),
  reference              text not null unique,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  submitter_role         text not null check (submitter_role in ('student','parent','guardian','referrer')),
  student_name           text not null,
  student_dob            date not null,
  is_minor               boolean not null,
  guardian_name          text,
  guardian_relationship  text,
  guardian_consent       boolean not null default false,
  referrer_organisation  text,
  email                  text not null,
  phone                  text not null,
  address                text not null,
  institution_name       text not null,
  institution_city       text not null,
  course                 text not null,
  academic_year          text not null,
  requested_amount       numeric(12,2) not null check (requested_amount > 0),
  purpose                text not null,
  household_context      text not null,
  declaration            boolean not null check (declaration),
  privacy_consent        boolean not null check (privacy_consent),
  status                 text not null default 'received' check (status in (
                           'received','screening','documents_pending','under_review',
                           'approved','declined','support_completed','closed')),
  acknowledged_at        timestamptz,
  assignee               text,
  internal_notes         text
);
alter table public.support_requests enable row level security;

create table if not exists public.support_documents (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.support_requests(id) on delete cascade,
  created_at    timestamptz not null default now(),
  doc_type      text not null,
  storage_path  text not null,
  file_name     text not null,
  size_bytes    int not null,
  mime_type     text not null
);
alter table public.support_documents enable row level security;

-- Private bucket: no storage policies, so only the service role can read/write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-documents', 'support-documents', false, 2097152,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Donations
-- ---------------------------------------------------------------------------
create table if not exists public.donation_purposes (
  slug    text primary key,
  label   text not null,
  active  boolean not null default true,
  sort    int not null default 0
);
alter table public.donation_purposes enable row level security;
create policy "public reads active purposes" on public.donation_purposes
  for select to anon, authenticated using (active);

insert into public.donation_purposes (slug, label, sort) values
  ('general',          'Where it is needed most', 0),
  ('education',        'Education support',       1),
  ('child-welfare',    'Child welfare',           2),
  ('elder-care',       'Elder care',              3),
  ('community',        'Community development',   4)
on conflict (slug) do nothing;

create table if not exists public.donations (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  amount_paise        int not null check (amount_paise > 0),
  currency            text not null default 'INR',
  purpose             text not null references public.donation_purposes(slug),
  donor_name          text not null,
  email               text not null,
  phone               text not null,
  address             text,
  pan                 text,
  display_anonymous   boolean not null default false,
  comms_consent       boolean not null default false,
  status              text not null default 'created' check (status in (
                        'created','pending','success','failed','cancelled','refunded','chargeback')),
  gateway             text not null default 'razorpay',
  gateway_order_id    text unique,
  gateway_payment_id  text unique,
  method              text,
  failure_reason      text,
  paid_at             timestamptz,
  receipt_no          text unique,
  receipt_issued_at   timestamptz,
  receipt_emailed_at  timestamptz,
  receipt_token       uuid not null default gen_random_uuid()
);
alter table public.donations enable row level security;
create index if not exists donations_status_idx on public.donations (status, created_at desc);

-- Every webhook delivery is stored once; the unique event id makes retries no-ops.
create table if not exists public.payment_events (
  id           bigserial primary key,
  event_id     text not null unique,
  event_type   text not null,
  received_at  timestamptz not null default now(),
  payload      jsonb not null
);
alter table public.payment_events enable row level security;

create sequence if not exists public.receipt_seq;

-- Marks a donation successful and issues its receipt number exactly once.
-- Safe to call repeatedly from the browser-return path and the webhook.
create or replace function public.confirm_donation(p_order_id text, p_payment_id text, p_method text)
returns table (out_donation_id uuid, out_receipt_no text, out_newly_confirmed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  d   donations%rowtype;
  fy  text;
  ist timestamp;
  r   text;
begin
  select * into d from donations where gateway_order_id = p_order_id for update;
  if not found then
    return;
  end if;

  if d.status = 'success' and d.receipt_no is not null then
    return query select d.id, d.receipt_no, false;
    return;
  end if;

  if d.status in ('refunded','chargeback') then
    return query select d.id, d.receipt_no, false;
    return;
  end if;

  ist := coalesce(d.paid_at, now()) at time zone 'Asia/Kolkata';
  fy := case when extract(month from ist) >= 4
             then extract(year from ist)::int || '-' || lpad(((extract(year from ist)::int + 1) % 100)::text, 2, '0')
             else (extract(year from ist)::int - 1) || '-' || lpad((extract(year from ist)::int % 100)::text, 2, '0')
        end;
  r := coalesce(d.receipt_no, 'NCT/' || fy || '/' || lpad(nextval('receipt_seq')::text, 6, '0'));

  update donations set
    status             = 'success',
    gateway_payment_id = coalesce(gateway_payment_id, p_payment_id),
    method             = coalesce(p_method, method),
    paid_at            = coalesce(paid_at, now()),
    receipt_no         = r,
    receipt_issued_at  = coalesce(receipt_issued_at, now()),
    failure_reason     = null,
    updated_at         = now()
  where id = d.id;

  return query select d.id, r, true;
end $$;

-- ---------------------------------------------------------------------------
-- Impact metrics (draft -> approved; only approved values are public)
-- ---------------------------------------------------------------------------
create table if not exists public.impact_metrics (
  key         text primary key,
  label       text not null,
  value       numeric,
  unit        text,
  definition  text not null,
  source      text,
  as_of       date,
  status      text not null default 'draft' check (status in ('draft','approved','retired')),
  approved_by text,
  sort        int not null default 0,
  updated_at  timestamptz not null default now()
);
alter table public.impact_metrics enable row level security;
create policy "public reads approved metrics" on public.impact_metrics
  for select to anon, authenticated
  using (status = 'approved' and value is not null and as_of is not null);

insert into public.impact_metrics (key, label, unit, definition, sort) values
  ('children_supported', 'Children supported', null,
   'Unique children who received at least one form of support from the trust since founding.', 0),
  ('education_requests_supported', 'Education requests supported', null,
   'Education-support requests approved and paid out since founding.', 1),
  ('active_donors', 'Active donors', null,
   'Unique donors with at least one successful donation in the last 12 months.', 2),
  ('funds_deployed', 'Funds deployed', 'INR',
   'Total amount disbursed to programmes and beneficiaries since founding, as per audited or reconciled records.', 3)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Audit triggers
-- ---------------------------------------------------------------------------
create or replace function public.audit_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into audit_log (entity, entity_id, action, detail)
    values (tg_table_name, new.id::text, 'status_change',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists support_requests_audit on public.support_requests;
create trigger support_requests_audit before update on public.support_requests
  for each row execute function public.audit_status_change();

drop trigger if exists donations_audit on public.donations;
create trigger donations_audit before update on public.donations
  for each row execute function public.audit_status_change();

create or replace function public.audit_metric_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (entity, entity_id, action, detail)
  values ('impact_metrics', new.key, lower(tg_op),
          jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists impact_metrics_audit on public.impact_metrics;
create trigger impact_metrics_audit before update on public.impact_metrics
  for each row execute function public.audit_metric_change();

-- Functions are for the server only.
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
revoke execute on function public.confirm_donation(text, text, text) from public, anon, authenticated;
