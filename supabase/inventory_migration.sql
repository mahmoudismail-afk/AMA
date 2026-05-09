-- ================================================================
-- AMA Gym — Inventory Tables Migration
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ================================================================

-- Inventory Items (Product Catalog)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('drinks', 'snacks', 'supplements', 'other')),
  cost_price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  sell_price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_qty           INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory Transactions (Sales & Restocks)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id      UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('sale', 'restock')),
  quantity     INTEGER NOT NULL,
  unit_price   NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.inventory_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access inventory_items"
  ON public.inventory_items FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Authenticated full access inventory_transactions"
  ON public.inventory_transactions FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
