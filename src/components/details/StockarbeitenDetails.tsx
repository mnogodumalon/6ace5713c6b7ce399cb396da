import type { Stockarbeiten, Bienenvoelker } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface StockarbeitenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Stockarbeiten;
  /** N:1-Ziel „Bienenvoelker": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  bienenvoelkerList: Bienenvoelker[];
  /** Klick auf die Bienenvoelker-Relation → overlay.push auf dessen Detail. */
  onOpenBienenvoelker?: (record: Bienenvoelker) => void;
}

export function StockarbeitenDetails({
  record,
  bienenvoelkerList,
  onOpenBienenvoelker,
}: StockarbeitenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const volkTarget = bienenvoelkerList.find(r => r.record_id === extractRecordId(record.fields.volk));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('stockarbeiten', 'datum')} value={record.fields.datum} format="datetime" />
        <RecordField label={fieldLabel('stockarbeiten', 'art')} value={Array.isArray(record.fields.art) ? record.fields.art.map((v: unknown) => (v && typeof v === 'object' && 'label' in v) ? (v as {label: unknown}).label : v).join(', ') : null} format="text" />
        <RecordField label={fieldLabel('stockarbeiten', 'volksstaerke')} value={record.fields.volksstaerke} format="pill" />
        <RecordField label={fieldLabel('stockarbeiten', 'sanftmut')} value={record.fields.sanftmut} format="pill" />
        <RecordField label={fieldLabel('stockarbeiten', 'brutbild')} value={record.fields.brutbild} format="pill" />
        <RecordField label={fieldLabel('stockarbeiten', 'weiselrichtig')} value={record.fields.weiselrichtig} format="bool" />
        <RecordField label={fieldLabel('stockarbeiten', 'varroabefall')} value={record.fields.varroabefall} format="text" />
        <RecordField label={fieldLabel('stockarbeiten', 'mittel')} value={record.fields.mittel} format="text" />
        <RecordField label={fieldLabel('stockarbeiten', 'menge')} value={record.fields.menge} format="text" />
        <RecordField label={fieldLabel('stockarbeiten', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('stockarbeiten', 'volk')}
          name={volkTarget?.fields.volksname ?? '—'}
          meta={[volkTarget?.fields.koenigin_herkunft].filter(Boolean).join(' · ') || undefined}
          onClick={volkTarget && onOpenBienenvoelker ? () => onOpenBienenvoelker!(volkTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.STOCKARBEITEN} recordId={record.record_id} readOnly={!perms.canWrite('stockarbeiten')} />
    </>
  );
}
