-- Supabase SQL Editor 에서 실행
create table if not exists public.availability (
  name text primary key,
  dates date[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.availability enable row level security;

-- 로그인 없이 anon key 로 읽기/쓰기 허용 (소규모 친구 모임용)
create policy "anon read"   on public.availability for select to anon using (true);
create policy "anon insert" on public.availability for insert to anon with check (true);
create policy "anon update" on public.availability for update to anon using (true) with check (true);
