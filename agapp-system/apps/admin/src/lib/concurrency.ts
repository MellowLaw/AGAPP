import { supabase } from '@/lib/supabase';

/**
 * Optimistic-concurrency guard for staff actions.
 *
 * Two people share these queues. Without a guard, both can open the same report,
 * both hit a status button, and the second write silently overwrites the first —
 * whoever clicked last wins and neither is told. That's how a report someone
 * already Rejected quietly becomes Resolved.
 *
 * The fix is a compare-and-set: the UPDATE only matches while the row still holds
 * the value the UI last read (`expected`). Zero matched rows then means one of
 * two very different things, so we re-read the row to tell them apart:
 *   - the row exists but the value moved  -> someone else got there first
 *   - the row is gone / RLS hides it      -> a real failure
 *
 * Compare against the RAW DATABASE VALUE, not a UI enum. The page-level status
 * maps are lossy (reports' mapDbStatusToUi() folds unknown values — including the
 * citizen self-withdraw 'Cancelled' — into 'submitted'), so round-tripping a UI
 * enum back through mapUiStatusToDb() would raise false conflicts.
 */
export type GuardedOutcome =
  | { outcome: 'ok' }
  /** Someone else changed the row first. `currentValue` is what it holds now. */
  | { outcome: 'conflict'; currentValue: unknown }
  | { outcome: 'error'; error: unknown };

export async function updateIfUnchanged(opts: {
  table: string;
  id: string;
  /** Column to compare-and-set on, plus the value the UI last saw. */
  expected: { column: string; value: unknown };
  patch: Record<string, unknown>;
}): Promise<GuardedOutcome> {
  const { table, id, expected, patch } = opts;

  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq('id', id)
    .eq(expected.column, expected.value as any)
    .select('id');

  if (error) return { outcome: 'error', error };
  if (data && data.length > 0) return { outcome: 'ok' };

  // Zero rows matched — work out whether we lost a race or genuinely failed.
  const { data: current, error: readErr } = await supabase
    .from(table)
    .select(expected.column)
    .eq('id', id)
    .maybeSingle();

  if (readErr) return { outcome: 'error', error: readErr };
  if (!current) return { outcome: 'error', error: new Error('Row not found or not visible.') };

  const currentValue = (current as any)[expected.column];
  if (currentValue !== expected.value) return { outcome: 'conflict', currentValue };

  // Same value but the write still matched nothing → RLS blocked the UPDATE.
  return { outcome: 'error', error: new Error('Update was not permitted.') };
}

/** Human-readable conflict message for a toast. */
export function conflictMessage(entity: string, currentValue: unknown): string {
  return `${entity} was just changed by someone else (now "${String(currentValue)}"). ` +
         `Your change was not applied — the list has been refreshed.`;
}
