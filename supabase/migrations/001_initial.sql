-- Run once in the Supabase SQL editor. All application operations use the anon key + user JWT.
create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, user_id uuid not null unique references auth.users(id) on delete cascade, display_name text, ai_day date, ai_count integer not null default 0, check(id=user_id));
create table public.companies (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null,created_at timestamptz not null default now(),unique(user_id,name),unique(id,user_id));
create table public.knowledge_items (id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,company_id uuid,mode text not null,payload jsonb not null,created_at timestamptz not null default now(),unique(id,user_id),foreign key(company_id,user_id) references public.companies(id,user_id));
create table public.contacts (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,company_id uuid,name text not null,unique(user_id,company_id,name),foreign key(company_id,user_id) references public.companies(id,user_id));
create table public.interactions (id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,company_id uuid,payload jsonb not null,created_at timestamptz not null default now(),foreign key(id,user_id) references public.knowledge_items(id,user_id) on delete cascade,foreign key(company_id,user_id) references public.companies(id,user_id));
create table public.intel_runs (like public.interactions including defaults including constraints);
alter table public.intel_runs add primary key(id),add foreign key(id,user_id) references public.knowledge_items(id,user_id) on delete cascade,add foreign key(company_id,user_id) references public.companies(id,user_id),add foreign key(user_id) references auth.users(id) on delete cascade;
create table public.inbox_items (like public.interactions including defaults including constraints);
alter table public.inbox_items add primary key(id),add foreign key(id,user_id) references public.knowledge_items(id,user_id) on delete cascade,add foreign key(company_id,user_id) references public.companies(id,user_id),add foreign key(user_id) references auth.users(id) on delete cascade;
create table public.opportunities (like public.interactions including defaults including constraints);
alter table public.opportunities add primary key(id),add foreign key(id,user_id) references public.knowledge_items(id,user_id) on delete cascade,add foreign key(company_id,user_id) references public.companies(id,user_id),add foreign key(user_id) references auth.users(id) on delete cascade;
create table public.next_actions (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,company text not null default '',title text not null,done boolean not null default false,due date not null default current_date);
do $$ declare t text; begin
 foreach t in array array['profiles','companies','contacts','interactions','intel_runs','inbox_items','knowledge_items','next_actions','opportunities'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy own_rows on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('create index on public.%I (user_id)',t);
 end loop;
end $$;
-- Quota counters are controlled only by the function below, never by the client.
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
create function public.consume_ai_quota() returns boolean language plpgsql security definer set search_path=public as $$
declare consumed integer;
begin
 if auth.uid() is null then return false; end if;
 insert into profiles(id,user_id,ai_day,ai_count) values(auth.uid(),auth.uid(),current_date,1)
 on conflict(id) do update set ai_day=current_date,ai_count=case when profiles.ai_day=current_date then profiles.ai_count+1 else 1 end
 where profiles.ai_day is distinct from current_date or profiles.ai_count<30 returning ai_count into consumed;
 return consumed is not null;
end $$;
revoke all on function public.consume_ai_quota() from public;
grant execute on function public.consume_ai_quota() to authenticated;
-- Invoker security preserves RLS. Saving all related context succeeds or fails as a transaction.
create function public.save_activity(activity jsonb) returns void language plpgsql security invoker set search_path=public as $$
declare company_uuid uuid; company_name text; activity_uuid uuid; contact_name text; target_table text;
begin
 if auth.uid() is null then raise exception 'Sign in before saving'; end if;
 activity_uuid := (activity->>'id')::uuid;
 company_name := trim(activity->'result'->>'company');
 if length(company_name)>0 then
 insert into companies(user_id,name) values(auth.uid(),company_name) on conflict(user_id,name) do update set name=excluded.name returning id into company_uuid;
 end if;
 insert into knowledge_items(id,user_id,company_id,mode,payload,created_at) values(activity_uuid,auth.uid(),company_uuid,activity->>'mode',activity,(activity->>'created_at')::timestamptz)
 on conflict(id) do update set payload=excluded.payload,company_id=excluded.company_id;
 if company_uuid is not null then
 for contact_name in select jsonb_array_elements_text(coalesce(activity->'result'->'contacts','[]'::jsonb)) loop
 insert into contacts(user_id,company_id,name) values(auth.uid(),company_uuid,contact_name) on conflict(user_id,company_id,name) do nothing;
 end loop;
 end if;
 target_table:=case activity->>'mode' when 'debrief' then 'interactions' when 'inbox' then 'inbox_items' when 'opportunity' then 'opportunities' else 'intel_runs' end;
 execute format('insert into %I(id,user_id,company_id,payload) values($1,$2,$3,$4) on conflict(id) do update set payload=excluded.payload',target_table) using activity_uuid,auth.uid(),company_uuid,activity;
end $$;
revoke all on function public.save_activity(jsonb) from public;
grant execute on function public.save_activity(jsonb) to authenticated;
