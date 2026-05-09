import { createClient } from '@/lib/supabase/server';
import InventoryClient from '@/components/inventory/InventoryClient';
import { requirePermission } from '@/lib/auth-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Inventory & Shop' };

export default async function InventoryPage() {
  await requirePermission('inventory');
  const supabase = await createClient();

  const [{ data: items }, { data: transactions }] = await Promise.all([
    supabase.from('inventory_items').select('*').order('created_at', { ascending: false }),
    supabase.from('inventory_transactions').select('*, inventory_items(name)').order('created_at', { ascending: false }),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Inventory & Shop
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage products, track stock, record sales and restocks.
        </p>
      </div>
      <InventoryClient
        initialItems={items ?? []}
        initialTransactions={transactions ?? []}
      />
    </div>
  );
}
