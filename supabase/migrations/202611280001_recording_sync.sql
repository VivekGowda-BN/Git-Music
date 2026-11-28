-- Only the owner can read a project, including projects marked public in the UI.
create table public.recording_projects (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  revision bigint not null default 1,
  payload jsonb, -- NULL is a deletion marker so an offline browser cannot resurrect it.
  primary key (user_id, id)
);
alter table public.recording_projects enable row level security;
revoke all on public.recording_projects from public, anon, authenticated;
grant select, insert, update on public.recording_projects to authenticated;
create policy "Read owned projects" on public.recording_projects for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Create owned projects" on public.recording_projects for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Change owned projects" on public.recording_projects for update to authenticated
  using (user_id = (select auth.uid()) and payload is not null)
  with check (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit)
values ('recording-audio', 'recording-audio', false, 4194304);
create policy "Read own recording audio" on storage.objects for select to authenticated
  using (bucket_id = 'recording-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Upload own recording audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'recording-audio' and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.recording_projects p where p.user_id = (select auth.uid())
      and p.id = (storage.foldername(name))[2] and p.payload is null));
create policy "Remove own recording audio" on storage.objects for delete to authenticated
  using (bucket_id = 'recording-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
