-- SNAPSHOT skema project PORTOFOLIO GEZENN (tckkhkxcflfhqlevnsjb)
-- Disusun dari information_schema / pg_catalog, BUKAN pg_dump. Bukan migrasi yang bisa dijalankan ulang langsung.

create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.categories (id uuid primary key default uuid_generate_v4(), name text not null, created_at timestamptz not null default now());
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null, description text not null,
  category_id uuid references public.categories(id) on delete set null,
  category_name text not null, year integer not null,
  cover_image_url text not null, gallery_urls text[] not null default '{}',
  video_url text, video_urls text[] not null default '{}',
  featured boolean not null default false, published boolean not null default true, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.settings (
  id integer primary key default 1 check (id = 1),
  editor_name text not null default 'Raka Adnyana', brand_logo text not null default 'Gezenn',
  headline text not null default 'Turning ideas into *visual stories.*',
  hero_description text not null, about_description text not null,
  profile_image_url text, hero_image_url text, whatsapp_url text, instagram_url text, email text, tiktok_url text,
  specializations text[] not null default array['Cinematic Editing','Short-form Content','Color Grading','Motion Graphics','Sound Design'],
  software text[] not null default array['Adobe Premiere Pro','After Effects','DaVinci Resolve','Lightroom','CapCut'],
  services jsonb not null default '[]'::jsonb check (jsonb_typeof(services) = 'array'),
  updated_at timestamptz not null default now()
);
create table public.section_styles (
  section_key text primary key,
  font_family text, color text check (color is null or color ~* '^#[0-9a-f]{6}$'),
  font_weight integer check (font_weight is null or font_weight in (100,200,300,400,500,600,700,800,900)),
  size_scale numeric check (size_scale is null or (size_scale >= 0.5 and size_scale <= 2)),
  updated_at timestamptz not null default now()
);
create table public.software_logos (
  id uuid primary key default uuid_generate_v4(), name text not null, logo_url text not null,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.settings enable row level security;
alter table public.section_styles enable row level security;
alter table public.software_logos enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())); $$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy public_read_categories on public.categories for select to anon, authenticated using (true);
create policy admin_all_categories on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy public_read_published_projects on public.projects for select to anon, authenticated using (published = true);
create policy admin_all_projects on public.projects for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy public_read_settings on public.settings for select to anon, authenticated using (true);
create policy admin_all_settings on public.settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy public_read_section_styles on public.section_styles for select to anon, authenticated using (true);
create policy admin_all_section_styles on public.section_styles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy public_read_software_logos on public.software_logos for select to anon, authenticated using (true);
create policy admin_all_software_logos on public.software_logos for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Storage (bucket dibaca publik; tulis hanya admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('project-images', 'project-images', true, 5242880, array['image/jpeg','image/jpg','image/png','image/webp']),
  ('software-logos', 'software-logos', true, 1048576, array['image/png','image/webp','image/svg+xml']);
create policy admin_read_images on storage.objects for select to authenticated using (bucket_id = 'project-images' and (select public.is_admin()));
create policy admin_upload_images on storage.objects for insert to authenticated with check (bucket_id = 'project-images' and (select public.is_admin()));
create policy admin_update_images on storage.objects for update to authenticated using (bucket_id = 'project-images' and (select public.is_admin()));
create policy admin_delete_images on storage.objects for delete to authenticated using (bucket_id = 'project-images' and (select public.is_admin()));
create policy admin_read_software_logos on storage.objects for select to authenticated using (bucket_id = 'software-logos' and (select public.is_admin()));
create policy admin_upload_software_logos on storage.objects for insert to authenticated with check (bucket_id = 'software-logos' and (select public.is_admin()));
create policy admin_update_software_logos on storage.objects for update to authenticated using (bucket_id = 'software-logos' and (select public.is_admin()));
create policy admin_delete_software_logos on storage.objects for delete to authenticated using (bucket_id = 'software-logos' and (select public.is_admin()));
