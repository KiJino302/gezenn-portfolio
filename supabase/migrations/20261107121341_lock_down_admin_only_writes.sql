-- 1) Daftar admin (tidak bisa dibaca/ditulis lewat API; hanya lewat fungsi is_admin)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

insert into public.admins (user_id)
select id from auth.users where email = 'admin@gezenn.studio'
on conflict do nothing;

-- 2) Fungsi cek admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 3) Ganti policy "semua user login boleh edit" -> "hanya admin"
drop policy if exists auth_all_projects on public.projects;
drop policy if exists auth_all_categories on public.categories;
drop policy if exists auth_all_settings on public.settings;

create policy admin_all_projects on public.projects
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_all_categories on public.categories
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_all_settings on public.settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- 4) Storage: hanya admin yang boleh upload/ubah/hapus/list.
drop policy if exists public_read_images on storage.objects;
drop policy if exists auth_upload_images on storage.objects;
drop policy if exists auth_delete_images on storage.objects;
drop policy if exists auth_update_images on storage.objects;

create policy admin_read_images on storage.objects
  for select to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()));
create policy admin_upload_images on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images' and (select public.is_admin()));
create policy admin_update_images on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()));
create policy admin_delete_images on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()));

-- 5) Rapikan warning advisor
alter function public.set_updated_at() set search_path = '';
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
