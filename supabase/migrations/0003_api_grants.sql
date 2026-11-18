-- Explicit Data API permissions.
-- Needed when the project was created with "Grant API access to new tables
-- automatically" turned OFF (Supabase's recommended setting). Safe to run
-- either way: it also removes the broad default grants if they were added.
--
-- Model: the website's server uses the service_role key for all writes.
-- The public (anon) key can only read donation purposes and impact metrics,
-- and row-level security further limits those to active / approved rows.

grant usage on schema public to anon, authenticated, service_role;

-- Public: nothing except the two readable tables.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on public.donation_purposes, public.impact_metrics to anon, authenticated;

-- Server (service role): full access to the app's tables, sequences and functions.
grant select, insert, update, delete on
  public.audit_log,
  public.rate_limits,
  public.enquiries,
  public.support_requests,
  public.support_documents,
  public.donation_purposes,
  public.donations,
  public.payment_events,
  public.impact_metrics
to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;
grant execute on function public.confirm_donation(text, text, text) to service_role;
