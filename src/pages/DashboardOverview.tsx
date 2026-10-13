import { useMemo, useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconBug, IconHeartbeat, IconStethoscope, IconCash } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import type { Honigverkaeufe, Stockarbeiten } from '@/types/app';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { formatDate, formatCurrency, lookupKey } from '@/lib/formatters';
import { tx, appLabel } from '@/i18n';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';
import type { Honigernten } from '@/types/app';

const VARROA_LIMIT = 3;
const REVIEW_DAYS = 21;

type Health = { volkId: string; varroa?: number; schwach: boolean; last?: Stockarbeiten };

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { bienenvoelker, stockarbeiten, honigernten, honigverkaeufe, setBienenvoelker, setHonigverkaeufe, fetchAll } = data;
  const clock = useClock();
  const [filter, setFilter] = useState<'all' | 'attention' | 'review'>('all');
  const [moveNote] = useState<string | null>(null);

  // One shared write path: mark a sale as paid (hero, work list, overlay footer).
  const markPaid = (v: Honigverkaeufe) => {
    const id = v.record_id;
    const set = (paid: boolean) =>
      setHonigverkaeufe(prev => prev.map(r => (r.record_id === id ? { ...r, fields: { ...r.fields, bezahlt: paid } } : r)));
    set(true);
    const name = v.fields.kaeufer_nachname ?? tx('Käufer');
    LivingAppsService.updateHonigverkaeufeEntry(id, { bezahlt: true }).catch(() => fetchAll());
    undoToast(tx`${name} — als bezahlt markiert`, () => {
      set(false);
      LivingAppsService.updateHonigverkaeufeEntry(id, { bezahlt: false }).catch(() => fetchAll());
    });
  };

  const crud = useEntityCrud(data, {
    footer: top =>
      top.type === 'honigverkaeufe' && !top.record.fields.bezahlt
        ? { label: tx('Als bezahlt markieren'), onClick: () => markPaid(top.record) }
        : undefined,
  });
  const enrichedBienenvoelker = crud.enriched.bienenvoelker;
  const enrichedStockarbeiten = crud.enriched.stockarbeiten;
  const enrichedHonigverkaeufe = crud.enriched.honigverkaeufe;

  const COLUMNS = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['bienenvoelker']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })),
    [],
  );

  // Latest Stockarbeit per Volk → health signal
  const healthByVolk = useMemo(() => {
    const latest = new Map<string, Stockarbeiten>();
    for (const s of stockarbeiten) {
      const id = extractRecordId(s.fields.volk);
      if (!id || !s.fields.datum) continue;
      const cur = latest.get(id);
      if (!cur || (cur.fields.datum ?? '') < s.fields.datum) latest.set(id, s);
    }
    const out = new Map<string, Health>();
    for (const [volkId, s] of latest) {
      const v = s.fields.varroabefall;
      out.set(volkId, {
        volkId,
        varroa: v,
        schwach: lookupKey(s.fields.volksstaerke) === 'schwach',
        last: s,
      });
    }
    return out;
  }, [stockarbeiten]);

  const isLive = (key?: string) => key === 'aktiv' || key === 'ableger';
  const attention = enrichedBienenvoelker.filter(v => {
    const h = healthByVolk.get(v.record_id);
    return isLive(lookupKey(v.fields.status)) && !!h && ((h.varroa ?? 0) >= VARROA_LIMIT || h.schwach);
  });
  const reviewDue = enrichedBienenvoelker.filter(v => {
    if (lookupKey(v.fields.status) !== 'aktiv') return false;
    const last = healthByVolk.get(v.record_id)?.last?.fields.datum;
    return !last || differenceInDays(clock, parseISO(last)) >= REVIEW_DAYS;
  });
  const attentionIds = new Set(attention.map(v => v.record_id));
  const reviewIds = new Set(reviewDue.map(v => v.record_id));

  const reasonOf = (id: string) => {
    const h = healthByVolk.get(id);
    if (!h) return '';
    if ((h.varroa ?? 0) >= VARROA_LIMIT && h.schwach) return tx`Varroa ${h.varroa} % · schwach`;
    if ((h.varroa ?? 0) >= VARROA_LIMIT) return tx`Varroa ${h.varroa} %`;
    return tx('Volk schwach');
  };

  const cards = useMemo<KanbanCard[]>(() => {
    return enrichedBienenvoelker
      .filter(v => filter === 'all' || (filter === 'attention' ? attentionIds.has(v.record_id) : reviewIds.has(v.record_id)))
      .map(v => ({
        id: `volk:${v.record_id}`,
        column: lookupKey(v.fields.status) ?? COLUMNS[0]?.key ?? '',
        title: v.fields.volksname ?? tx('Ohne Namen'),
        subtitle: attentionIds.has(v.record_id) ? `${v.standortName} · ${reasonOf(v.record_id)}` : v.standortName,
        tone: attentionIds.has(v.record_id) ? ('warning' as const) : ('default' as const),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedBienenvoelker, filter, healthByVolk, COLUMNS, clock]);

  const moveCard = (cardId: string, newColumn: string) => {
    const id = cardId.split(':')[1];
    const rec = bienenvoelker.find(v => v.record_id === id);
    if (!rec) return;
    const oldKey = lookupKey(rec.fields.status);
    const setStatus = (key: string) =>
      setBienenvoelker(prev => prev.map(v => (v.record_id === id ? { ...v, fields: { ...v.fields, status: lookupOption('bienenvoelker', 'status', key) } } : v)));
    setStatus(newColumn);
    LivingAppsService.updateBienenvoelkerEntry(id, { status: newColumn }).catch(() => fetchAll());
    const name = rec.fields.volksname ?? tx('Volk');
    const label = COLUMNS.find(c => c.key === newColumn)?.label ?? newColumn;
    undoToast(tx`${name} → ${label}`, () => {
      if (!oldKey) return;
      setStatus(oldKey);
      LivingAppsService.updateBienenvoelkerEntry(id, { status: oldKey }).catch(() => fetchAll());
    });
  };

  // Sales
  const unpaid = enrichedHonigverkaeufe
    .filter(v => !v.fields.bezahlt)
    .sort((a, b) => (a.fields.verkaufsdatum ?? '').localeCompare(b.fields.verkaufsdatum ?? ''));
  const unpaidSum = unpaid.reduce((s, v) => s + (v.fields.preis_gesamt ?? 0), 0);
  const buyer = (v: Honigverkaeufe) =>
    [v.fields.kaeufer_vorname, v.fields.kaeufer_nachname].filter(Boolean).join(' ') || tx('Unbekannt');

  // Recent work
  const recentWork = [...enrichedStockarbeiten]
    .sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? ''))
    .slice(0, 6);

  // Season harvest
  const year = format(clock, 'yyyy');
  const seasonRows = useMemo<ChartRow<Honigernten>[]>(
    () =>
      honigernten
        .filter(h => (h.fields.erntedatum ?? '').startsWith(year))
        .map(h => ({ id: `ernte:${h.record_id}`, data: h })),
    [honigernten, year],
  );

  const activeCount = bienenvoelker.filter(v => isLive(lookupKey(v.fields.status))).length;
  const lastWork = recentWork[0];

  let context: string;
  if (bienenvoelker.length === 0) context = tx('Lege dein erstes Bienenvolk an, dann geht es los.');
  else if (attention.length === 1) context = tx`${namen(attention.map(v => v.fields.volksname ?? ''))} braucht einen Blick.`;
  else if (attention.length > 1) context = tx`${namen(attention.map(v => v.fields.volksname ?? ''))} brauchen einen Blick.`;
  else if (lastWork) context = tx`Alle ${activeCount} aktiven Völker sind fit — zuletzt bearbeitet: ${lastWork.volkName}.`;
  else context = tx`${activeCount} aktive Völker warten auf ihre erste Durchsicht.`;

  const hero =
    bienenvoelker.length === 0 ? (
      <HeroBanner
        icon={<IconBug size={18} />}
        action={{ label: tx('Erstes Volk anlegen'), onClick: () => crud.bienenvoelker.openCreate({ status: 'aktiv' }) }}
      >
        {tx('Noch keine Bienenvölker — richte deinen Bestand ein.')}
      </HeroBanner>
    ) : unpaid.length > 0 ? (
      <HeroBanner
        icon={<IconAlertTriangle size={18} />}
        action={{ label: tx('Als bezahlt markieren'), onClick: () => markPaid(unpaid[0]) }}
      >
        <b>{namen(unpaid.map(v => v.fields.kaeufer_nachname ?? buyer(v)))}</b>{' '}
        {unpaid.length === 1
          ? tx`hat noch nicht bezahlt — ${formatCurrency(unpaidSum)} offen (Verkauf vom ${formatDate(unpaid[0].fields.verkaufsdatum)}).`
          : tx`haben noch nicht bezahlt — ${formatCurrency(unpaidSum)} offen, ältester Verkauf vom ${formatDate(unpaid[0].fields.verkaufsdatum)}.`}
      </HeroBanner>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.stockarbeiten.canWrite && (
          <Button onClick={() => crud.stockarbeiten.openCreate({})} className="shrink-0">
            <IconPlus size={16} className="mr-1 shrink-0" />
            {tx('Stockarbeit erfassen')}
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={hero}
        kpis={
          bienenvoelker.length > 0 ? (
            <StatStrip>
              <StatStripItem
                title={tx('Brauchen Aufmerksamkeit')}
                value={attention.length}
                icon={<IconHeartbeat size={16} className="text-muted-foreground" />}
                tone={attention.length > 0 ? 'warning' : 'default'}
                onClick={() => setFilter(f => (f === 'attention' ? 'all' : 'attention'))}
                active={filter === 'attention'}
              />
              <StatStripItem
                title={tx('Durchsicht überfällig')}
                value={reviewDue.length}
                icon={<IconStethoscope size={16} className="text-muted-foreground" />}
                tone={reviewDue.length > 0 ? 'primary' : 'default'}
                onClick={() => setFilter(f => (f === 'review' ? 'all' : 'review'))}
                active={filter === 'review'}
              />
            </StatStrip>
          ) : undefined
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={COLUMNS}
            defaultCollapsed={['aufgeloest']}
            onCardClick={card => {
              const rec = bienenvoelker.find(v => v.record_id === card.id.split(':')[1]);
              if (rec) crud.bienenvoelker.openDetail(rec);
            }}
            onCardMove={crud.bienenvoelker.canWrite ? (id, col) => { moveCard(id, col); } : undefined}
            onAddCard={crud.bienenvoelker.canWrite ? col => crud.bienenvoelker.openCreate({ status: col }) : undefined}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Völker mit Handlungsbedarf')}
              items={attention.slice(0, 6).map(v => ({
                id: v.record_id,
                title: v.fields.volksname ?? tx('Ohne Namen'),
                secondLine: (
                  <>
                    <span className="font-medium text-amber-600">{reasonOf(v.record_id)}</span>
                    <span className="text-muted-foreground"> · {v.standortName}</span>
                  </>
                ),
                action: { label: tx('Durchsicht'), onClick: () => crud.stockarbeiten.openCreate({ volk: v.record_id }) },
              }))}
              onItemClick={id => {
                const rec = bienenvoelker.find(v => v.record_id === id);
                if (rec) crud.bienenvoelker.openDetail(rec);
              }}
              empty={{ text: tx('Alle Völker sind stark und varroa-arm.') }}
            />
            <WorkList
              title={tx('Letzte Stockarbeiten')}
              items={recentWork.map(s => ({
                id: s.record_id,
                title: s.volkName || tx('Ohne Volk'),
                secondLine: (
                  <span className="text-muted-foreground">
                    {formatDate(s.fields.datum)}
                    {s.fields.art?.length ? ` · ${s.fields.art.map(a => a.label).join(', ')}` : ''}
                  </span>
                ),
              }))}
              onItemClick={id => {
                const rec = stockarbeiten.find(s => s.record_id === id);
                if (rec) crud.stockarbeiten.openDetail(rec);
              }}
              empty={{
                text: tx('Noch keine Stockarbeiten erfasst.'),
                action: { label: tx('Stockarbeit erfassen'), onClick: () => crud.stockarbeiten.openCreate({}) },
              }}
            />
            <ChartWidget<Honigernten>
              title={tx`Honigernte ${year} nach Sorte`}
              rows={seasonRows}
              dimension={{ kind: 'category', accessor: r => r.data.fields.honigsorte, label: tx('Honigsorte') }}
              measure={{ aggregate: 'sum', label: tx('Ernte (kg)'), value: r => r.data.fields.menge_kg ?? null, format: 'number' }}
            />
          </>
        }
      />
      {moveNote}
      {crud.surfaces}
    </div>
  );
}
