-- ============================================================
-- AvaliaAI — Supabase Schema
-- Migration: initial setup
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. PAGE VISITS
-- Registra cada visita à landing page de investidores,
-- mesmo sem o usuário preencher o formulário.
-- ──────────────────────────────────────────────────────────
create table if not exists page_visits (
  id           uuid        default gen_random_uuid() primary key,
  created_at   timestamptz default now()             not null,
  page         text        default 'investor_landing' not null,
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  user_agent   text,
  language     text,
  screen_width  integer,
  screen_height integer,
  timezone     text
);

-- Somente INSERT anônimo permitido (sem leitura pública)
alter table page_visits enable row level security;

create policy "allow_anon_insert_visits"
  on page_visits for insert
  with check (true);

-- ──────────────────────────────────────────────────────────
-- 2. INVESTOR LEADS
-- Registra quem preencheu o formulário de interesse.
-- ──────────────────────────────────────────────────────────
create table if not exists investor_leads (
  id         uuid        default gen_random_uuid() primary key,
  created_at timestamptz default now()             not null,
  name       text        not null,
  email      text        not null,
  profile    text        not null,
  ticket     text        not null,
  message    text,
  source     text        default 'landing_page'    not null,
  visit_id   uuid        references page_visits(id) on delete set null
);

-- Somente INSERT anônimo permitido
alter table investor_leads enable row level security;

create policy "allow_anon_insert_leads"
  on investor_leads for insert
  with check (true);
