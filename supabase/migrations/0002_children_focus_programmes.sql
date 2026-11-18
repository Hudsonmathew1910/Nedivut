-- Content revision: Nedivut now focuses on children's education, care and development.
-- Elder care is retired, Student Mentorship & Development takes its place, and
-- programme names are made consistent across the site and donation options.

-- Retire elder care. Deactivated rather than deleted so past donations keep a valid purpose.
update public.donation_purposes set active = false where slug = 'elder-care';

insert into public.donation_purposes (slug, label, sort) values
  ('general',       'Where it is needed most',            0),
  ('education',     'Education Support',                  1),
  ('child-welfare', 'Child Welfare & Care',               2),
  ('mentorship',    'Student Mentorship & Development',   3),
  ('community',     'Community Development & Engagement', 4)
on conflict (slug) do update
  set label = excluded.label, sort = excluded.sort, active = true;
