import { useMemo, useState } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { IconPlus, IconCoin, IconHeartbeat, IconBucket } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { lookupOption, LOOKUP_OPTIONS } from '@/types/app';
import type { Honigverkaeufe } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { extractRecordId } from '@/services/livingAppsService';
import { formatCurrency, formatDate, lookupKey } from '@/lib/formatters';
import { gruss, namen, undoToast, useClock } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';
import { countOf } from '@/config/plan';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { KanbanWidget, type KanbanCard, type KanbanColumn } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';
import type { Honigernten } from '@/types/app';

const DURCHSICHT_TAGE = 14;

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { bienenvoelker, stockarbeiten, honigernten, honigverkaeufe, setBienenvoelker, setHonigverkaeufe, fetchAll } = data;
  const clock = useClock();
  const [onlyDue, setOnlyDue] = useState(false);

  const advancePaid = (r: Honigverkaeufe) => {
    const before = r.fields.bezahlt;
    setHonigverkaeufe(prev => prev.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, bezahlt: true } } : x));
    LivingAppsService.updateHonigverkaeufeEntry(r.record_id, { bezahlt: true })
      .then(() => undoToast(tx('Als bezahlt markiert'), () => {
        setHonigverkaeufe(prev => prev.map(x => x.record_id === r.record_id ? { ...x, fields: { ...x.fields, bezahlt: before } } : x));
        void LivingAppsService.updateHonigverkaeufeEntry(r.record_id, { bezahlt: before ?? false });
      }))
      .catch(() => void fetchAll());
  };

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'honigverkaeufe' && !top.record.fields.bezahlt) {
        const rec = top.record;
        return { label: tx('Als bezahlt markieren'), onClick: () => advancePaid(rec) };
      }
      if (top.type === 'bienenvoelker') {
        const id = top.record.record_id;
        return { label: tx('Stockarbeit erfassen'), onClick: () => crud.stockarbeiten.openCreate({ volk: id }) };
      }
      return undefined;
    },
  });
  const enrichedHv = crud.enriched.honigverkaeufe;

  const columns = useMemo<KanbanColumn[]>(
    () => (LOOKUP_OPTIONS['bienenvoelker']?.['status'] ?? []).map(o => ({ key: o.key, label: o.label })),
    [],
  );

  // letzte Stockarbeit je Volk
  const lastWork = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of stockarbeiten) {
      const id = extractRecordId(s.fields.volk);
      const d = s.fields.datum;
      if (!id || !d) continue;
      const cur = m.get(id);
      if (!cur || d > cur) m.set(id, d);
    }
    return m;
  }, [stockarbeiten]);

  const due = useMemo(() => {
    const list = bienenvoelker
      .filter(v => lookupKey(v.fields.status) === 'aktiv')
      .map(v => {
        const last = lastWork.get(v.record_id);
        const days = last ? differenceInDays(clock, parseISO(last)) : null;
        return { v, last, days };
      })
      .filter(x => x.days === null || x.days >= DURCHSICHT_TAGE);
    return list.sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999));
  }, [bienenvoelker, lastWork, clock]);
  const dueIds = useMemo(() => new Set(due.map(x => x.v.record_id)), [due]);

  const aktiv = bienenvoelker.filter(v => lookupKey(v.fields.status) === 'aktiv').length;
  const jahr = format(clock, 'yyyy');
  const ernteKg = honigernten
    .filter(h => (h.fields.erntedatum ?? '').startsWith(jahr))
    .reduce((s, h) => s + (h.fields.menge_kg ?? 0), 0);
  const unpaid = honigverkaeufe.filter(h => !h.fields.bezahlt);
  const unpaidSum = unpaid.reduce((s, h) => s + (h.fields.preis_gesamt ?? 0), 0);

  const cards = useMemo<KanbanCard[]>(
    () => crud.enriched.bienenvoelker
      .filter(v => !onlyDue || dueIds.has(v.record_id))
      .map(v => ({
        id: `volk:${v.record_id}`,
        column: lookupKey(v.fields.status) ?? columns[0]?.key ?? '',
        title: v.fields.volksname ?? '—',
        subtitle: v.standortName || undefined,
        tone: dueIds.has(v.record_id) ? 'warning' as const : 'default' as const,
      })),
    [crud.enriched.bienenvoelker, onlyDue, dueIds, columns],
  );

  const moveCard = (cardId: string, newColumn: string) => {
    const rid = cardId.split(':')[1];
    const rec = bienenvoelker.find(v => v.record_id === rid);
    if (!rid || !rec) return;
    const prevStatus = lookupKey(rec.fields.status);
    setBienenvoelker(prev => prev.map(v => v.record_id === rid
      ? { ...v, fields: { ...v.fields, status: lookupOption('bienenvoelker', 'status', newColumn) } } : v));
    LivingAppsService.updateBienenvoelkerEntry(rid, { status: newColumn })
      .then(() => undoToast(tx`${rec.fields.volksname ?? ''} verschoben`, () => {
        if (!prevStatus) return;
        setBienenvoelker(prev => prev.map(v => v.record_id === rid
          ? { ...v, fields: { ...v.fields, status: lookupOption('bienenvoelker', 'status', prevStatus) } } : v));
        void LivingAppsService.updateBienenvoelkerEntry(rid, { status: prevStatus });
      }))
      .catch(() => void fetchAll());
  };

  const ernteRows = useMemo<ChartRow<Honigernten>[]>(
    () => honigernten.map(h => ({ id: `ernte:${h.record_id}`, data: h })),
    [honigernten],
  );

  // Kontextzeile
  const names = due.map(x => x.v.fields.volksname ?? '').filter(Boolean);
  let context: string;
  if (bienenvoelker.length === 0) context = tx('Lege dein erstes Bienenvolk an, dann geht es los.');
  else if (due.length > 0) context = due.length === 1 ? tx`${namen(names)} braucht eine Durchsicht.` : tx`${namen(names)} brauchen eine Durchsicht.`;
  else if (unpaid.length > 0) context = tx`${namen(enrichedHv.filter(h => !h.fields.bezahlt).map(h => h.fields.kaeufer_nachname ?? ''))} ${unpaid.length === 1 ? tx('hat noch nicht bezahlt.') : tx('haben noch nicht bezahlt.')}`;
  else context = tx`Alle Völker sind versorgt — ${countOf('bienenvoelker', aktiv, appLabel('bienenvoelker'))} aktiv.`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {crud.stockarbeiten.canWrite && (
            <Button variant="outline" onClick={() => crud.stockarbeiten.openCreate({})}>
              <IconPlus size={16} className="shrink-0" />{tx('Stockarbeit')}
            </Button>
          )}
          {crud.bienenvoelker.canWrite && (
            <Button onClick={() => crud.bienenvoelker.openCreate({ status: 'aktiv' })}>
              <IconPlus size={16} className="shrink-0" />{tx('Neues Volk')}
            </Button>
          )}
        </div>
      </div>

      <DashboardGrid
        variant="wide"
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Durchsicht fällig')}
              value={due.length}
              icon={<IconHeartbeat size={16} />}
              tone={due.length > 0 ? 'warning' : 'default'}
              onClick={() => setOnlyDue(v => !v)}
              active={onlyDue}
            />
            <StatStripItem
              title={tx`Honig ${jahr}`}
              value={`${Math.round(ernteKg * 10) / 10} kg`}
              icon={<IconBucket size={16} />}
              onClick={() => crud.honigernten.openCreate({})}
            />
            <StatStripItem
              title={tx('Offen zu bezahlen')}
              value={formatCurrency(unpaidSum)}
              icon={<IconCoin size={16} />}
              tone={unpaid.length > 0 ? 'primary' : 'default'}
              onClick={() => crud.honigverkaeufe.openCreate({})}
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            defaultCollapsed={['aufgeloest']}
            onCardClick={card => {
              const v = bienenvoelker.find(x => x.record_id === card.id.split(':')[1]);
              if (v) crud.bienenvoelker.openDetail(v);
            }}
            onCardMove={moveCard}
            onAddCard={crud.bienenvoelker.canWrite ? (column => crud.bienenvoelker.openCreate({ status: column })) : undefined}
          />
        }
        aside={
          <>
            <WorkList
              title={tx('Durchsicht fällig')}
              items={due.map(({ v, last, days }) => ({
                id: v.record_id,
                title: v.fields.volksname ?? '—',
                secondLine: (
                  <span className="text-muted-foreground">
                    {last
                      ? <><span className="font-medium text-amber-600">{tx`seit ${days} Tagen`}</span> · {formatDate(last)}</>
                      : <span className="font-medium text-amber-600">{tx('Noch keine Stockarbeit')}</span>}
                  </span>
                ),
                action: crud.stockarbeiten.canWrite
                  ? { label: tx('Durchsicht erfassen'), onClick: () => crud.stockarbeiten.openCreate({ volk: v.record_id, art: ['durchsicht'] }) }
                  : undefined,
              }))}
              onItemClick={id => { const v = bienenvoelker.find(x => x.record_id === id); if (v) crud.bienenvoelker.openDetail(v); }}
              empty={{ text: tx('Alle aktiven Völker sind in den letzten zwei Wochen durchgesehen worden.') }}
            />
            <WorkList
              title={tx('Offene Zahlungen')}
              items={unpaid.map(h => {
                const e = enrichedHv.find(x => x.record_id === h.record_id);
                return {
                  id: h.record_id,
                  title: `${h.fields.kaeufer_vorname ?? ''} ${h.fields.kaeufer_nachname ?? ''}`.trim() || '—',
                  secondLine: (
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{formatCurrency(h.fields.preis_gesamt)}</span>
                      {' · '}{formatDate(h.fields.verkaufsdatum)}{e?.ernteName ? ` · ${e.ernteName}` : ''}
                    </span>
                  ),
                  action: { label: tx('Bezahlt'), onClick: () => advancePaid(h) },
                };
              })}
              onItemClick={id => { const h = honigverkaeufe.find(x => x.record_id === id); if (h) crud.honigverkaeufe.openDetail(h); }}
              empty={{
                text: tx('Alle Verkäufe sind bezahlt.'),
                action: crud.honigverkaeufe.canWrite ? { label: tx('Verkauf erfassen'), onClick: () => crud.honigverkaeufe.openCreate({}) } : undefined,
              }}
            />
            <ChartWidget<Honigernten>
              title={tx('Honigernte nach Sorte')}
              rows={ernteRows}
              dimension={{ kind: 'category', accessor: r => r.data.fields.honigsorte, label: tx('Sorte') }}
              measure={{ aggregate: 'sum', label: tx('Menge'), value: r => r.data.fields.menge_kg ?? null, format: 'number' }}
              interaction={{ mode: 'drill', onSegmentClick: seg => { const h = honigernten.find(x => `ernte:${x.record_id}` === seg.rowIds[0]); if (h) crud.honigernten.openDetail(h); } }}
            />
          </>
        }
      />

      {crud.surfaces}
    </div>
  );
}
