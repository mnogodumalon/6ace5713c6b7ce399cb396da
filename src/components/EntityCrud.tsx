/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'standorte'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.standorte.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.standorte.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.standorte.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.standorte              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   standorte: strasse, hausnummer, plz, ort, koordinaten, kontakt_vorname, kontakt_nachname, kontakt_telefon, …  ·  ← bienenvoelker (list + contextual +)
 *   bienenvoelker: volksname, standort, rasse, beutentyp, status, einrichtungsdatum, koenigin_baujahr, koenigin_farbe, …  ·  → standorte · ← stockarbeiten (list + contextual +) · ← honigernten (list + contextual +)
 *   stockarbeiten: volk, datum, art, volksstaerke, sanftmut, brutbild, weiselrichtig, varroabefall, …  ·  → bienenvoelker
 *   honigernten: volk, honigsorte, menge_kg, wassergehalt, anzahl_glaeser, charge, bemerkungen, erntedatum  ·  → bienenvoelker · ← honigverkaeufe (list + contextual +)
 *   honigverkaeufe: verkaufsdatum, ernte, kaeufer_vorname, kaeufer_nachname, gebindegroesse, anzahl, menge_kg, preis_gesamt, …  ·  → honigernten
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Standorte, Bienenvoelker, Stockarbeiten, Honigernten, Honigverkaeufe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichBienenvoelker, enrichStockarbeiten, enrichHonigernten, enrichHonigverkaeufe } from '@/lib/enrich';
import type { EnrichedBienenvoelker, EnrichedStockarbeiten, EnrichedHonigernten, EnrichedHonigverkaeufe } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { StandorteDialog, type StandorteDialogDefaults } from '@/components/dialogs/StandorteDialog';
import { StandorteDetails } from '@/components/details/StandorteDetails';
import { BienenvoelkerDialog, type BienenvoelkerDialogDefaults } from '@/components/dialogs/BienenvoelkerDialog';
import { BienenvoelkerDetails } from '@/components/details/BienenvoelkerDetails';
import { StockarbeitenDialog, type StockarbeitenDialogDefaults } from '@/components/dialogs/StockarbeitenDialog';
import { StockarbeitenDetails } from '@/components/details/StockarbeitenDetails';
import { HonigerntenDialog, type HonigerntenDialogDefaults } from '@/components/dialogs/HonigerntenDialog';
import { HonigerntenDetails } from '@/components/details/HonigerntenDetails';
import { HonigverkaeufeDialog, type HonigverkaeufeDialogDefaults } from '@/components/dialogs/HonigverkaeufeDialog';
import { HonigverkaeufeDetails } from '@/components/details/HonigverkaeufeDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'standorte'; record: Standorte }
  | { type: 'bienenvoelker'; record: EnrichedBienenvoelker }
  | { type: 'stockarbeiten'; record: EnrichedStockarbeiten }
  | { type: 'honigernten'; record: EnrichedHonigernten }
  | { type: 'honigverkaeufe'; record: EnrichedHonigverkaeufe };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  standorte: EntityCrudApi<Standorte, StandorteDialogDefaults>;
  bienenvoelker: EntityCrudApi<Bienenvoelker, BienenvoelkerDialogDefaults>;
  stockarbeiten: EntityCrudApi<Stockarbeiten, StockarbeitenDialogDefaults>;
  honigernten: EntityCrudApi<Honigernten, HonigerntenDialogDefaults>;
  honigverkaeufe: EntityCrudApi<Honigverkaeufe, HonigverkaeufeDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { standorte: Standorte[]; bienenvoelker: EnrichedBienenvoelker[]; stockarbeiten: EnrichedStockarbeiten[]; honigernten: EnrichedHonigernten[]; honigverkaeufe: EnrichedHonigverkaeufe[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [standorteDialog, setStandorteDialog] = useState<{ defaults?: StandorteDialogDefaults; editing?: Standorte } | null>(null);
  const [bienenvoelkerDialog, setBienenvoelkerDialog] = useState<{ defaults?: BienenvoelkerDialogDefaults; editing?: Bienenvoelker } | null>(null);
  const [stockarbeitenDialog, setStockarbeitenDialog] = useState<{ defaults?: StockarbeitenDialogDefaults; editing?: Stockarbeiten } | null>(null);
  const [honigerntenDialog, setHonigerntenDialog] = useState<{ defaults?: HonigerntenDialogDefaults; editing?: Honigernten } | null>(null);
  const [honigverkaeufeDialog, setHonigverkaeufeDialog] = useState<{ defaults?: HonigverkaeufeDialogDefaults; editing?: Honigverkaeufe } | null>(null);
  const enrichedBienenvoelker = useMemo(() => enrichBienenvoelker(data.bienenvoelker, { standorteMap: data.standorteMap }), [data.bienenvoelker, data.standorteMap]);
  const enrichedStockarbeiten = useMemo(() => enrichStockarbeiten(data.stockarbeiten, { bienenvoelkerMap: data.bienenvoelkerMap }), [data.stockarbeiten, data.bienenvoelkerMap]);
  const enrichedHonigernten = useMemo(() => enrichHonigernten(data.honigernten, { bienenvoelkerMap: data.bienenvoelkerMap }), [data.honigernten, data.bienenvoelkerMap]);
  const enrichedHonigverkaeufe = useMemo(() => enrichHonigverkaeufe(data.honigverkaeufe, { honigerntenMap: data.honigerntenMap }), [data.honigverkaeufe, data.honigerntenMap]);

  function detailStandorte(record: Standorte, push = false) {
    const item: OverlayItem = { type: 'standorte', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitStandorte(fields: Standorte['fields']) {
    const editing = standorteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setStandorte(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateStandorteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('standorte')} — ${t('crud_updated')}`, async () => {
        data.setStandorte(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateStandorteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createStandorteEntry(fields);
      undoToast(`${appLabel('standorte')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailBienenvoelker(record: Bienenvoelker, push = false) {
    const rec = enrichedBienenvoelker.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'bienenvoelker', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBienenvoelker(fields: Bienenvoelker['fields']) {
    const editing = bienenvoelkerDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBienenvoelker(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBienenvoelkerEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('bienenvoelker')} — ${t('crud_updated')}`, async () => {
        data.setBienenvoelker(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBienenvoelkerEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBienenvoelkerEntry(fields);
      undoToast(`${appLabel('bienenvoelker')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailStockarbeiten(record: Stockarbeiten, push = false) {
    const rec = enrichedStockarbeiten.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'stockarbeiten', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitStockarbeiten(fields: Stockarbeiten['fields']) {
    const editing = stockarbeitenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setStockarbeiten(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateStockarbeitenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('stockarbeiten')} — ${t('crud_updated')}`, async () => {
        data.setStockarbeiten(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateStockarbeitenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createStockarbeitenEntry(fields);
      undoToast(`${appLabel('stockarbeiten')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailHonigernten(record: Honigernten, push = false) {
    const rec = enrichedHonigernten.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'honigernten', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitHonigernten(fields: Honigernten['fields']) {
    const editing = honigerntenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setHonigernten(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateHonigerntenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('honigernten')} — ${t('crud_updated')}`, async () => {
        data.setHonigernten(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateHonigerntenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createHonigerntenEntry(fields);
      undoToast(`${appLabel('honigernten')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailHonigverkaeufe(record: Honigverkaeufe, push = false) {
    const rec = enrichedHonigverkaeufe.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'honigverkaeufe', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitHonigverkaeufe(fields: Honigverkaeufe['fields']) {
    const editing = honigverkaeufeDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setHonigverkaeufe(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateHonigverkaeufeEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('honigverkaeufe')} — ${t('crud_updated')}`, async () => {
        data.setHonigverkaeufe(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateHonigverkaeufeEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createHonigverkaeufeEntry(fields);
      undoToast(`${appLabel('honigverkaeufe')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <StandorteDialog
        open={standorteDialog !== null}
        onClose={() => setStandorteDialog(null)}
        onSubmit={submitStandorte}
        defaultValues={standorteDialog?.defaults}
        recordId={standorteDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Standorte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Standorte']}
      />
      <BienenvoelkerDialog
        open={bienenvoelkerDialog !== null}
        onClose={() => setBienenvoelkerDialog(null)}
        onSubmit={submitBienenvoelker}
        defaultValues={bienenvoelkerDialog?.defaults}
        recordId={bienenvoelkerDialog?.editing?.record_id}
        standorteList={data.standorte}
        enablePhotoScan={AI_PHOTO_SCAN['Bienenvoelker']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bienenvoelker']}
      />
      <StockarbeitenDialog
        open={stockarbeitenDialog !== null}
        onClose={() => setStockarbeitenDialog(null)}
        onSubmit={submitStockarbeiten}
        defaultValues={stockarbeitenDialog?.defaults}
        recordId={stockarbeitenDialog?.editing?.record_id}
        bienenvoelkerList={data.bienenvoelker}
        enablePhotoScan={AI_PHOTO_SCAN['Stockarbeiten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Stockarbeiten']}
      />
      <HonigerntenDialog
        open={honigerntenDialog !== null}
        onClose={() => setHonigerntenDialog(null)}
        onSubmit={submitHonigernten}
        defaultValues={honigerntenDialog?.defaults}
        recordId={honigerntenDialog?.editing?.record_id}
        bienenvoelkerList={data.bienenvoelker}
        enablePhotoScan={AI_PHOTO_SCAN['Honigernten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Honigernten']}
      />
      <HonigverkaeufeDialog
        open={honigverkaeufeDialog !== null}
        onClose={() => setHonigverkaeufeDialog(null)}
        onSubmit={submitHonigverkaeufe}
        defaultValues={honigverkaeufeDialog?.defaults}
        recordId={honigverkaeufeDialog?.editing?.record_id}
        honigerntenList={data.honigernten}
        enablePhotoScan={AI_PHOTO_SCAN['Honigverkaeufe']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Honigverkaeufe']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'standorte') {
            return (
              <>
                <RecordHeader title={top.record.fields.strasse ?? appLabel('standorte')} subtitle={undefined} />
                <StandorteDetails
                  record={top.record}
                  bienenvoelkerList={data.bienenvoelker}
                  onOpenBienenvoelker={(r) => detailBienenvoelker(r, true)}
                  onAddBienenvoelker={perms.canWrite('bienenvoelker') ? () => setBienenvoelkerDialog({ defaults: { standort: createRecordUrl(APP_IDS.STANDORTE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'bienenvoelker') {
            return (
              <>
                <RecordHeader title={top.record.fields.volksname ?? appLabel('bienenvoelker')} subtitle={top.record.fields.einrichtungsdatum ? formatDate(top.record.fields.einrichtungsdatum) : undefined} />
                <BienenvoelkerDetails
                  record={top.record}
                  standorteList={data.standorte}
                  onOpenStandorte={(r) => detailStandorte(r, true)}
                  stockarbeitenList={data.stockarbeiten}
                  onOpenStockarbeiten={(r) => detailStockarbeiten(r, true)}
                  onAddStockarbeiten={perms.canWrite('stockarbeiten') ? () => setStockarbeitenDialog({ defaults: { volk: createRecordUrl(APP_IDS.BIENENVOELKER, top.record.record_id) } }) : undefined}
                  honigerntenList={data.honigernten}
                  onOpenHonigernten={(r) => detailHonigernten(r, true)}
                  onAddHonigernten={perms.canWrite('honigernten') ? () => setHonigerntenDialog({ defaults: { volk: createRecordUrl(APP_IDS.BIENENVOELKER, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'stockarbeiten') {
            return (
              <>
                <RecordHeader title={top.record.fields.mittel ?? appLabel('stockarbeiten')} subtitle={top.record.fields.datum ? formatDate(top.record.fields.datum) : undefined} />
                <StockarbeitenDetails
                  record={top.record}
                  bienenvoelkerList={data.bienenvoelker}
                  onOpenBienenvoelker={(r) => detailBienenvoelker(r, true)}
                />
              </>
            );
          }
          if (top.type === 'honigernten') {
            return (
              <>
                <RecordHeader title={top.record.fields.charge ?? appLabel('honigernten')} subtitle={top.record.fields.erntedatum ? formatDate(top.record.fields.erntedatum) : undefined} />
                <HonigerntenDetails
                  record={top.record}
                  bienenvoelkerList={data.bienenvoelker}
                  onOpenBienenvoelker={(r) => detailBienenvoelker(r, true)}
                  honigverkaeufeList={data.honigverkaeufe}
                  onOpenHonigverkaeufe={(r) => detailHonigverkaeufe(r, true)}
                  onAddHonigverkaeufe={perms.canWrite('honigverkaeufe') ? () => setHonigverkaeufeDialog({ defaults: { ernte: createRecordUrl(APP_IDS.HONIGERNTEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'honigverkaeufe') {
            return (
              <>
                <RecordHeader title={top.record.fields.kaeufer_vorname ?? appLabel('honigverkaeufe')} subtitle={top.record.fields.verkaufsdatum ? formatDate(top.record.fields.verkaufsdatum) : undefined} />
                <HonigverkaeufeDetails
                  record={top.record}
                  honigerntenList={data.honigernten}
                  onOpenHonigernten={(r) => detailHonigernten(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'standorte') return perms.canWrite('standorte');
          if (top.type === 'bienenvoelker') return perms.canWrite('bienenvoelker');
          if (top.type === 'stockarbeiten') return perms.canWrite('stockarbeiten');
          if (top.type === 'honigernten') return perms.canWrite('honigernten');
          if (top.type === 'honigverkaeufe') return perms.canWrite('honigverkaeufe');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'standorte') setStandorteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'bienenvoelker') setBienenvoelkerDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'stockarbeiten') setStockarbeitenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'honigernten') setHonigerntenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'honigverkaeufe') setHonigverkaeufeDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    standorte: {
      openCreate: (defaults?: StandorteDialogDefaults) => (perms.canWrite('standorte') ? setStandorteDialog({ defaults }) : refuse()),
      openEdit: (record: Standorte) => (perms.canWrite('standorte') ? setStandorteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Standorte) => detailStandorte(record, false),
      canWrite: perms.canWrite('standorte'),
    },
    bienenvoelker: {
      openCreate: (defaults?: BienenvoelkerDialogDefaults) => (perms.canWrite('bienenvoelker') ? setBienenvoelkerDialog({ defaults }) : refuse()),
      openEdit: (record: Bienenvoelker) => (perms.canWrite('bienenvoelker') ? setBienenvoelkerDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Bienenvoelker) => detailBienenvoelker(record, false),
      canWrite: perms.canWrite('bienenvoelker'),
    },
    stockarbeiten: {
      openCreate: (defaults?: StockarbeitenDialogDefaults) => (perms.canWrite('stockarbeiten') ? setStockarbeitenDialog({ defaults }) : refuse()),
      openEdit: (record: Stockarbeiten) => (perms.canWrite('stockarbeiten') ? setStockarbeitenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Stockarbeiten) => detailStockarbeiten(record, false),
      canWrite: perms.canWrite('stockarbeiten'),
    },
    honigernten: {
      openCreate: (defaults?: HonigerntenDialogDefaults) => (perms.canWrite('honigernten') ? setHonigerntenDialog({ defaults }) : refuse()),
      openEdit: (record: Honigernten) => (perms.canWrite('honigernten') ? setHonigerntenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Honigernten) => detailHonigernten(record, false),
      canWrite: perms.canWrite('honigernten'),
    },
    honigverkaeufe: {
      openCreate: (defaults?: HonigverkaeufeDialogDefaults) => (perms.canWrite('honigverkaeufe') ? setHonigverkaeufeDialog({ defaults }) : refuse()),
      openEdit: (record: Honigverkaeufe) => (perms.canWrite('honigverkaeufe') ? setHonigverkaeufeDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Honigverkaeufe) => detailHonigverkaeufe(record, false),
      canWrite: perms.canWrite('honigverkaeufe'),
    },
    enriched: { standorte: data.standorte, bienenvoelker: enrichedBienenvoelker, stockarbeiten: enrichedStockarbeiten, honigernten: enrichedHonigernten, honigverkaeufe: enrichedHonigverkaeufe },
  };
}
