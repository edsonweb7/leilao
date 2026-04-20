-- ============================================================
-- AvaliaAI — Supabase Schema (Créditos e Asaas Paywall)
-- Migration: Add user_credits, transactions and decrement RPC
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. USER CREDITS
-- ──────────────────────────────────────────────────────────
create table if not exists public.user_credits (
  user_id uuid references auth.users(id) on delete cascade primary key,
  balance integer default 1 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Policies
alter table public.user_credits enable row level security;

-- O usuário logado só pode ver o seu próprio saldo.
create policy "Users can view their own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- O usuário não pode atualizar (update) a tabela sozinho, apenas o sistema (backends/RPC) faz isso.

-- ──────────────────────────────────────────────────────────
-- 2. TRIGGER PARA NOVO USUÁRIO
-- Função para inserir automaticamente 1 crédito
-- ──────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 1);
  return new;
end;
$$ language plpgsql;

-- O trigger é ativado na tabela auth.users nativa do Supabase
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────
-- 3. TRANSACTIONS (Extrato e Histórico)
-- Guardar o log de pagamentos (Asaas/Stripe) e consumos
-- ──────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  transaction_type varchar(50) not null, -- 'consume_report', 'topup_asaas_pix', 'topup_asaas_cc'
  amount_cents integer default 0,        -- Valor em centavos (se compra)
  credits_delta integer not null,        -- Mudança de créditos (ex: -1, +3, +10, +30)
  reference_id text,                     -- ID de referência no gateway (payment_id)
  created_at timestamptz default now() not null
);

alter table public.transactions enable row level security;
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────
-- 4. RPC: CONSUMIR CRÉDITO COM SEGURANÇA
-- Função invocada pelo app.js para gastar 1 token atomicamente
-- ──────────────────────────────────────────────────────────
create or replace function public.decrement_credit()
returns boolean
language plpgsql
security definer
as $$
declare
  current_balance int;
begin
  -- 1) Buscar saldo com lock FOR UPDATE para evitar concorrência
  select balance into current_balance
  from public.user_credits
  where user_id = auth.uid()
  for update;
  
  -- 2) Se não existir user_credits ou saldo for 0, rejeita
  if current_balance is null or current_balance <= 0 then
    return false;
  end if;
  
  -- 3) Decrementa
  update public.user_credits
  set balance = balance - 1,
      updated_at = now()
  where user_id = auth.uid();
  
  -- 4) Registra no log de transações
  insert into public.transactions (user_id, transaction_type, credits_delta)
  values (auth.uid(), 'consume_report', -1);
  
  return true;
end;
$$;
