'use server';

import { revalidatePath } from 'next/cache';
import { requireActionPermission, getServiceClient, AuthError } from '@/lib/auth/guards';

const VALID_CATEGORIES = ['drinks', 'snacks', 'supplements', 'other'] as const;
const VALID_TXN_TYPES = ['sale', 'restock'] as const;

function authFail(err: unknown) {
  if (err instanceof AuthError) return { error: 'Not authorized' };
  throw err;
}

export async function saveInventoryItem(data: {
  id?: string;
  name: string;
  category: string;
  cost_price: number;
  sell_price: number;
  stock_qty: number;
  low_stock_threshold: number;
}): Promise<{ data?: any; error?: string }> {
  try { await requireActionPermission('inventory'); } catch (e) { return authFail(e); }

  const name = String(data?.name ?? '').trim();
  if (!name) return { error: 'Name is required.' };
  if (!VALID_CATEGORIES.includes(data?.category as (typeof VALID_CATEGORIES)[number])) {
    return { error: 'Invalid category.' };
  }
  if (typeof data?.cost_price !== 'number' || !Number.isFinite(data.cost_price) || data.cost_price < 0) {
    return { error: 'Enter a valid cost price.' };
  }
  if (typeof data?.sell_price !== 'number' || !Number.isFinite(data.sell_price) || data.sell_price < 0) {
    return { error: 'Enter a valid sell price.' };
  }
  if (typeof data?.stock_qty !== 'number' || !Number.isInteger(data.stock_qty) || data.stock_qty < 0) {
    return { error: 'Enter a valid quantity.' };
  }
  if (
    typeof data?.low_stock_threshold !== 'number' ||
    !Number.isInteger(data.low_stock_threshold) ||
    data.low_stock_threshold < 0
  ) {
    return { error: 'Enter a valid low stock threshold.' };
  }

  const payload = {
    name,
    category: data.category,
    cost_price: data.cost_price,
    sell_price: data.sell_price,
    stock_qty: data.stock_qty,
    low_stock_threshold: data.low_stock_threshold,
  };

  const supabase = getServiceClient();
  const query = data.id
    ? supabase.from('inventory_items').update(payload).eq('id', data.id).select().single()
    : supabase.from('inventory_items').insert(payload).select().single();

  const { data: row, error } = await query;
  if (error) return { error: error.message };

  revalidatePath('/inventory');
  return { data: row };
}

export async function deleteInventoryItem(id: string): Promise<{ success?: boolean; error?: string }> {
  try { await requireActionPermission('inventory'); } catch (e) { return authFail(e); }
  if (!id || typeof id !== 'string') return { error: 'Invalid product ID.' };

  const supabase = getServiceClient();
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/inventory');
  return { success: true };
}

export async function recordInventoryTransaction(data: {
  item_id: string;
  type: 'sale' | 'restock';
  quantity: number;
  notes?: string | null;
}): Promise<{ data?: any; newStock?: number; error?: string }> {
  try { await requireActionPermission('inventory'); } catch (e) { return authFail(e); }

  if (!data?.item_id || typeof data.item_id !== 'string') return { error: 'Invalid product.' };
  if (!VALID_TXN_TYPES.includes(data?.type)) return { error: 'Invalid transaction type.' };
  if (typeof data?.quantity !== 'number' || !Number.isInteger(data.quantity) || data.quantity < 1) {
    return { error: 'Quantity must be at least 1.' };
  }

  const supabase = getServiceClient();
  const { data: item, error: itemErr } = await supabase
    .from('inventory_items')
    .select('id, name, cost_price, sell_price, stock_qty')
    .eq('id', data.item_id)
    .single();

  if (itemErr || !item) return { error: 'Product not found.' };

  if (data.type === 'sale' && item.stock_qty < data.quantity) {
    return { error: `Not enough stock. Available: ${item.stock_qty}` };
  }

  const unitPrice = data.type === 'sale' ? Number(item.sell_price) : Number(item.cost_price);
  const totalAmount = data.quantity * unitPrice;
  const newStock = data.type === 'sale' ? item.stock_qty - data.quantity : item.stock_qty + data.quantity;

  const { data: txnData, error: txnErr } = await supabase
    .from('inventory_transactions')
    .insert({
      item_id: item.id,
      type: data.type,
      quantity: data.quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      notes: data.notes ? String(data.notes).trim() || null : null,
    })
    .select()
    .single();

  if (txnErr) return { error: txnErr.message };

  const { error: stockErr } = await supabase
    .from('inventory_items')
    .update({ stock_qty: newStock })
    .eq('id', item.id);

  if (stockErr) return { error: stockErr.message };

  revalidatePath('/inventory');
  return { data: txnData, newStock };
}
