import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Standorte, Bienenvoelker, Stockarbeiten, Honigernten, Honigverkaeufe } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'standorte' | 'bienenvoelker' | 'stockarbeiten' | 'honigernten' | 'honigverkaeufe';

/** Silent re-read interval from the plan (generated): visitors or tools add records. */
const LIVE_MS = 0;
/** The lists a tick re-reads — ONE request each; the rest waits for an event or the tab's return. */
const LIVE_ENTITIES: string[] = [];
/** Marks a list the tick skipped: its rows and its forbidden state stay as they are. */
const SKIP = Symbol('skip');

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [standorte, setStandorte] = useState<Standorte[]>([]);
  const [bienenvoelker, setBienenvoelker] = useState<Bienenvoelker[]>([]);
  const [stockarbeiten, setStockarbeiten] = useState<Stockarbeiten[]>([]);
  const [honigernten, setHonigernten] = useState<Honigernten[]>([]);
  const [honigverkaeufe, setHonigverkaeufe] = useState<Honigverkaeufe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  /** Lists the signed-in user may not read (403 on the platform). They load as
   *  empty and the rest of the page loads normally — one forbidden list used to
   *  empty the whole dashboard (05.10.2026). Hide a block whose list is here. */
  const [forbidden, setForbidden] = useState<DashboardEntity[]>([]);

  // Every list on its own: a 403 is „not yours“, any other failure is an error.
  const forbiddenRef = useRef<DashboardEntity[]>([]);
  const settle = useCallback((settled: PromiseSettledResult<unknown>[]) => {
    const denied: DashboardEntity[] = [];
    let failure: unknown = null;
    // null = this list failed for another reason, or the tick skipped it: its current data stays
    const pick = <T,>(i: number, key: DashboardEntity): T[] | null => {
      const s = settled[i];
      if (s.status === 'fulfilled') return s.value as T[];
      if (s.reason === SKIP) { if (forbiddenRef.current.includes(key)) denied.push(key); return null; }
      if ((s.reason as { status?: number } | null)?.status === 403) { denied.push(key); return []; }
      failure = failure ?? s.reason;
      return null;
    };
    { const rows = pick<Standorte>(0, 'standorte'); if (rows) setStandorte(rows); }
    { const rows = pick<Bienenvoelker>(1, 'bienenvoelker'); if (rows) setBienenvoelker(rows); }
    { const rows = pick<Stockarbeiten>(2, 'stockarbeiten'); if (rows) setStockarbeiten(rows); }
    { const rows = pick<Honigernten>(3, 'honigernten'); if (rows) setHonigernten(rows); }
    { const rows = pick<Honigverkaeufe>(4, 'honigverkaeufe'); if (rows) setHonigverkaeufe(rows); }
    forbiddenRef.current = denied;
    setForbidden(prev => (prev.join('|') === denied.join('|') ? prev : denied));
    return failure;
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const failure = settle(await Promise.allSettled([
        omit.has('standorte') ? Promise.resolve([] as Standorte[]) : LivingAppsService.getStandorte(),
        omit.has('bienenvoelker') ? Promise.resolve([] as Bienenvoelker[]) : LivingAppsService.getBienenvoelker(),
        omit.has('stockarbeiten') ? Promise.resolve([] as Stockarbeiten[]) : LivingAppsService.getStockarbeiten(),
        omit.has('honigernten') ? Promise.resolve([] as Honigernten[]) : LivingAppsService.getHonigernten(),
        omit.has('honigverkaeufe') ? Promise.resolve([] as Honigverkaeufe[]) : LivingAppsService.getHonigverkaeufe(),
      ]));
      if (failure) throw failure;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey, settle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        // a failed list keeps its stale data out of the way: settle() only
        // replaces what loaded or was refused
        settle(await Promise.allSettled([
          omit.has('standorte') ? Promise.resolve([] as Standorte[]) : LivingAppsService.getStandorte(),
          omit.has('bienenvoelker') ? Promise.resolve([] as Bienenvoelker[]) : LivingAppsService.getBienenvoelker(),
          omit.has('stockarbeiten') ? Promise.resolve([] as Stockarbeiten[]) : LivingAppsService.getStockarbeiten(),
          omit.has('honigernten') ? Promise.resolve([] as Honigernten[]) : LivingAppsService.getHonigernten(),
          omit.has('honigverkaeufe') ? Promise.resolve([] as Honigverkaeufe[]) : LivingAppsService.getHonigverkaeufe(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    // Records that arrive without the team (a visitor on a public page, a
    // tool) show up by themselves: a silent re-read every LIVE_MS while the
    // tab is visible, once on return (S-1/W-19, acceptance 4 — the moderation
    // saw new contributions only after a reload). 0 = events only.
    // the tick: only LIVE_ENTITIES, one request each
    const only = new Set(LIVE_ENTITIES);
    async function tick() {
      try {
        settle(await Promise.allSettled([
          !only.has('standorte') ? Promise.reject(SKIP) : omit.has('standorte') ? Promise.resolve([] as Standorte[]) : LivingAppsService.getStandorte(),
          !only.has('bienenvoelker') ? Promise.reject(SKIP) : omit.has('bienenvoelker') ? Promise.resolve([] as Bienenvoelker[]) : LivingAppsService.getBienenvoelker(),
          !only.has('stockarbeiten') ? Promise.reject(SKIP) : omit.has('stockarbeiten') ? Promise.resolve([] as Stockarbeiten[]) : LivingAppsService.getStockarbeiten(),
          !only.has('honigernten') ? Promise.reject(SKIP) : omit.has('honigernten') ? Promise.resolve([] as Honigernten[]) : LivingAppsService.getHonigernten(),
          !only.has('honigverkaeufe') ? Promise.reject(SKIP) : omit.has('honigverkaeufe') ? Promise.resolve([] as Honigverkaeufe[]) : LivingAppsService.getHonigverkaeufe(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    const timer = LIVE_MS > 0 && only.size > 0 ? window.setInterval(() => { if (!document.hidden) void tick(); }, LIVE_MS) : null;
    const onVisible = () => { if (!document.hidden && LIVE_MS > 0) void silentRefresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('assistant:data-changed', handleRefresh);
      if (timer !== null) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [omitKey, settle]);

  const standorteMap = useMemo(() => {
    const m = new Map<string, Standorte>();
    standorte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [standorte]);

  const bienenvoelkerMap = useMemo(() => {
    const m = new Map<string, Bienenvoelker>();
    bienenvoelker.forEach(r => m.set(r.record_id, r));
    return m;
  }, [bienenvoelker]);

  const honigerntenMap = useMemo(() => {
    const m = new Map<string, Honigernten>();
    honigernten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [honigernten]);

  return { standorte, setStandorte, bienenvoelker, setBienenvoelker, stockarbeiten, setStockarbeiten, honigernten, setHonigernten, honigverkaeufe, setHonigverkaeufe, loading, error, fetchAll, forbidden, standorteMap, bienenvoelkerMap, honigerntenMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;