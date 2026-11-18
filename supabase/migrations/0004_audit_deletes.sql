-- Audit log: also record deletions of personal and financial records, and
-- status changes on enquiries. (0001 already logs status changes on donations
-- and support requests, and every edit to impact metrics.)
--
-- Deletions keep a snapshot of the identifying fields only (not documents or
-- free-text personal details), so the log shows what was removed and when
-- without becoming a second copy of the personal data.

create or replace function public.audit_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (entity, entity_id, action, detail)
  values (
    tg_table_name,
    old.id::text,
    'delete',
    case tg_table_name
      when 'donations' then jsonb_build_object(
        'status', old.status, 'amount_paise', old.amount_paise,
        'receipt_no', old.receipt_no, 'gateway_payment_id', old.gateway_payment_id)
      when 'support_requests' then jsonb_build_object('reference', old.reference, 'status', old.status)
      else jsonb_build_object('status', old.status)
    end
  );
  return old;
end $$;

drop trigger if exists donations_audit_delete on public.donations;
create trigger donations_audit_delete after delete on public.donations
  for each row execute function public.audit_delete();

drop trigger if exists support_requests_audit_delete on public.support_requests;
create trigger support_requests_audit_delete after delete on public.support_requests
  for each row execute function public.audit_delete();

drop trigger if exists enquiries_audit_delete on public.enquiries;
create trigger enquiries_audit_delete after delete on public.enquiries
  for each row execute function public.audit_delete();

-- Enquiries have no updated_at column, so they get their own status trigger.
create or replace function public.audit_enquiry_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into audit_log (entity, entity_id, action, detail)
    values ('enquiries', new.id::text, 'status_change',
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end $$;

drop trigger if exists enquiries_audit on public.enquiries;
create trigger enquiries_audit after update on public.enquiries
  for each row execute function public.audit_enquiry_status();

-- The audit log itself is append-only for the website's server key.
revoke update, delete on public.audit_log from service_role;
