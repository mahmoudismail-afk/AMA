-- ================================================================
-- PERMISSION-SCOPED RLS POLICIES (2026-11-23)
-- Enforces system_settings.staff_permissions at the Postgres RLS layer
-- and restricts direct client DELETE on core tables to admins.
-- Run AFTER 20261104_security_hardening.sql. Safe to re-run.
-- ================================================================

-- 1. Permission helper reading public.system_settings['staff_permissions']
CREATE OR REPLACE FUNCTION public.has_staff_permission(perm_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.current_app_role() = 'admin' THEN TRUE
    WHEN public.current_app_role() = 'staff' THEN COALESCE(
      (
        SELECT
          CASE
            WHEN jsonb_typeof(raw_val) = 'array' THEN raw_val
            WHEN jsonb_typeof(raw_val) = 'string'
              AND left(btrim(raw_val #>> '{}'), 1) = '['
              THEN (raw_val #>> '{}')::jsonb
            ELSE '["dashboard","members","checkins","classes"]'::jsonb
          END ? perm_key
        FROM (
          SELECT value AS raw_val
          FROM public.system_settings
          WHERE key = 'staff_permissions'
          LIMIT 1
        ) s
      ),
      '["dashboard","members","checkins","classes"]'::jsonb ? perm_key
    )
    ELSE FALSE
  END
$$;

REVOKE ALL ON FUNCTION public.has_staff_permission(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_staff_permission(TEXT) TO authenticated;

-- 2. Replace broad *_staff_all policies with permission-scoped policies

-- expenses
DROP POLICY IF EXISTS expenses_staff_all ON public.expenses;
DROP POLICY IF EXISTS expenses_select_perm ON public.expenses;
DROP POLICY IF EXISTS expenses_insert_perm ON public.expenses;
DROP POLICY IF EXISTS expenses_update_perm ON public.expenses;
DROP POLICY IF EXISTS expenses_delete_admin ON public.expenses;

CREATE POLICY expenses_select_perm ON public.expenses FOR SELECT TO authenticated
  USING (
    public.has_staff_permission('expenses')
    OR public.has_staff_permission('dashboard')
    OR public.has_staff_permission('history')
    OR public.has_staff_permission('reports')
  );
CREATE POLICY expenses_insert_perm ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission('expenses'));
CREATE POLICY expenses_update_perm ON public.expenses FOR UPDATE TO authenticated
  USING (public.has_staff_permission('expenses'))
  WITH CHECK (public.has_staff_permission('expenses'));
CREATE POLICY expenses_delete_admin ON public.expenses FOR DELETE TO authenticated
  USING (public.is_admin());

-- payments
DROP POLICY IF EXISTS payments_staff_all ON public.payments;
DROP POLICY IF EXISTS payments_select_perm ON public.payments;
DROP POLICY IF EXISTS payments_insert_perm ON public.payments;
DROP POLICY IF EXISTS payments_update_perm ON public.payments;
DROP POLICY IF EXISTS payments_delete_perm ON public.payments;

CREATE POLICY payments_select_perm ON public.payments FOR SELECT TO authenticated
  USING (
    public.has_staff_permission('payments')
    OR public.has_staff_permission('members')
    OR public.has_staff_permission('dashboard')
    OR public.has_staff_permission('history')
    OR public.has_staff_permission('reports')
  );
CREATE POLICY payments_insert_perm ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission('payments'));
CREATE POLICY payments_update_perm ON public.payments FOR UPDATE TO authenticated
  USING (public.has_staff_permission('payments'))
  WITH CHECK (public.has_staff_permission('payments'));
CREATE POLICY payments_delete_perm ON public.payments FOR DELETE TO authenticated
  USING (public.has_staff_permission('payments'));

-- membership_plans
DROP POLICY IF EXISTS membership_plans_staff_all ON public.membership_plans;
DROP POLICY IF EXISTS membership_plans_select_perm ON public.membership_plans;
DROP POLICY IF EXISTS membership_plans_insert_perm ON public.membership_plans;
DROP POLICY IF EXISTS membership_plans_update_perm ON public.membership_plans;
DROP POLICY IF EXISTS membership_plans_delete_admin ON public.membership_plans;

CREATE POLICY membership_plans_select_perm ON public.membership_plans FOR SELECT TO authenticated
  USING (
    public.has_staff_permission('plans')
    OR public.has_staff_permission('members')
    OR public.has_staff_permission('dashboard')
    OR public.has_staff_permission('history')
    OR public.has_staff_permission('reports')
  );
CREATE POLICY membership_plans_insert_perm ON public.membership_plans FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission('plans'));
CREATE POLICY membership_plans_update_perm ON public.membership_plans FOR UPDATE TO authenticated
  USING (public.has_staff_permission('plans'))
  WITH CHECK (public.has_staff_permission('plans'));
CREATE POLICY membership_plans_delete_admin ON public.membership_plans FOR DELETE TO authenticated
  USING (public.is_admin());

-- inventory_items
DROP POLICY IF EXISTS inventory_items_staff_all ON public.inventory_items;
DROP POLICY IF EXISTS inventory_items_select_perm ON public.inventory_items;
DROP POLICY IF EXISTS inventory_items_insert_perm ON public.inventory_items;
DROP POLICY IF EXISTS inventory_items_update_perm ON public.inventory_items;
DROP POLICY IF EXISTS inventory_items_delete_admin ON public.inventory_items;

CREATE POLICY inventory_items_select_perm ON public.inventory_items FOR SELECT TO authenticated
  USING (public.has_staff_permission('inventory'));
CREATE POLICY inventory_items_insert_perm ON public.inventory_items FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission('inventory'));
CREATE POLICY inventory_items_update_perm ON public.inventory_items FOR UPDATE TO authenticated
  USING (public.has_staff_permission('inventory'))
  WITH CHECK (public.has_staff_permission('inventory'));
CREATE POLICY inventory_items_delete_admin ON public.inventory_items FOR DELETE TO authenticated
  USING (public.is_admin());

-- inventory_transactions
DROP POLICY IF EXISTS inventory_transactions_staff_all ON public.inventory_transactions;
DROP POLICY IF EXISTS inventory_transactions_select_perm ON public.inventory_transactions;
DROP POLICY IF EXISTS inventory_transactions_insert_perm ON public.inventory_transactions;
DROP POLICY IF EXISTS inventory_transactions_update_perm ON public.inventory_transactions;
DROP POLICY IF EXISTS inventory_transactions_delete_perm ON public.inventory_transactions;

CREATE POLICY inventory_transactions_select_perm ON public.inventory_transactions FOR SELECT TO authenticated
  USING (
    public.has_staff_permission('inventory')
    OR public.has_staff_permission('history')
    OR public.has_staff_permission('reports')
  );
CREATE POLICY inventory_transactions_insert_perm ON public.inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission('inventory'));
CREATE POLICY inventory_transactions_update_perm ON public.inventory_transactions FOR UPDATE TO authenticated
  USING (public.has_staff_permission('inventory'))
  WITH CHECK (public.has_staff_permission('inventory'));
CREATE POLICY inventory_transactions_delete_perm ON public.inventory_transactions FOR DELETE TO authenticated
  USING (public.has_staff_permission('inventory'));

-- members
DROP POLICY IF EXISTS members_staff_all ON public.members;
DROP POLICY IF EXISTS members_select_perm ON public.members;
DROP POLICY IF EXISTS members_insert_perm ON public.members;
DROP POLICY IF EXISTS members_update_perm ON public.members;
DROP POLICY IF EXISTS members_delete_admin ON public.members;

CREATE POLICY members_select_perm ON public.members FOR SELECT TO authenticated
  USING (
    public.has_staff_permission('members')
    OR public.has_staff_permission('payments')
    OR public.has_staff_permission('dashboard')
    OR public.has_staff_permission('history')
    OR public.has_staff_permission('reports')
  );
CREATE POLICY members_insert_perm ON public.members FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission('members'));
CREATE POLICY members_update_perm ON public.members FOR UPDATE TO authenticated
  USING (public.has_staff_permission('members'))
  WITH CHECK (public.has_staff_permission('members'));
CREATE POLICY members_delete_admin ON public.members FOR DELETE TO authenticated
  USING (public.is_admin());

-- memberships
DROP POLICY IF EXISTS memberships_staff_all ON public.memberships;
DROP POLICY IF EXISTS memberships_select_perm ON public.memberships;
DROP POLICY IF EXISTS memberships_insert_perm ON public.memberships;
DROP POLICY IF EXISTS memberships_update_perm ON public.memberships;
DROP POLICY IF EXISTS memberships_delete_perm ON public.memberships;

CREATE POLICY memberships_select_perm ON public.memberships FOR SELECT TO authenticated
  USING (
    public.has_staff_permission('members')
    OR public.has_staff_permission('dashboard')
    OR public.has_staff_permission('history')
    OR public.has_staff_permission('reports')
  );
CREATE POLICY memberships_insert_perm ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_permission('members'));
CREATE POLICY memberships_update_perm ON public.memberships FOR UPDATE TO authenticated
  USING (public.has_staff_permission('members'))
  WITH CHECK (public.has_staff_permission('members'));
CREATE POLICY memberships_delete_perm ON public.memberships FOR DELETE TO authenticated
  USING (public.has_staff_permission('members'));
