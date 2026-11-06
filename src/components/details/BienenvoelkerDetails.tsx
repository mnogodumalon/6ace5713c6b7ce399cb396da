import type { Bienenvoelker, Standorte, Stockarbeiten, Honigernten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface BienenvoelkerDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Bienenvoelker;
  /** N:1-Ziel „Standorte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  standorteList: Standorte[];
  /** Klick auf die Standorte-Relation → overlay.push auf dessen Detail. */
  onOpenStandorte?: (record: Standorte) => void;
  /** 1:N „Stockarbeiten" (volk): VOLLE Liste — der Block filtert auf diesen Record. */
  stockarbeitenList: Stockarbeiten[];
  /** Zeilen-Klick → overlay.push auf das Stockarbeiten-Detail (nie der Edit-Dialog). */
  onOpenStockarbeiten: (record: Stockarbeiten) => void;
  /** Kontextuelles „+": öffnet den Stockarbeiten-Dialog mit diesem Record vorgesetzt. */
  onAddStockarbeiten?: () => void;
  /** 1:N „Honigernten" (volk): VOLLE Liste — der Block filtert auf diesen Record. */
  honigerntenList: Honigernten[];
  /** Zeilen-Klick → overlay.push auf das Honigernten-Detail (nie der Edit-Dialog). */
  onOpenHonigernten: (record: Honigernten) => void;
  /** Kontextuelles „+": öffnet den Honigernten-Dialog mit diesem Record vorgesetzt. */
  onAddHonigernten?: () => void;
}

export function BienenvoelkerDetails({
  record,
  standorteList,
  onOpenStandorte,
  stockarbeitenList,
  onOpenStockarbeiten,
  onAddStockarbeiten,
  honigerntenList,
  onOpenHonigernten,
  onAddHonigernten,
}: BienenvoelkerDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const standortTarget = standorteList.find(r => r.record_id === extractRecordId(record.fields.standort));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('bienenvoelker', 'volksname')} value={record.fields.volksname} format="text" />
        <RecordField label={fieldLabel('bienenvoelker', 'rasse')} value={record.fields.rasse} format="pill" />
        <RecordField label={fieldLabel('bienenvoelker', 'beutentyp')} value={record.fields.beutentyp} format="pill" />
        <RecordField label={fieldLabel('bienenvoelker', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('bienenvoelker', 'einrichtungsdatum')} value={record.fields.einrichtungsdatum} format="date" />
        <RecordField label={fieldLabel('bienenvoelker', 'koenigin_baujahr')} value={record.fields.koenigin_baujahr} format="text" />
        <RecordField label={fieldLabel('bienenvoelker', 'koenigin_farbe')} value={record.fields.koenigin_farbe} format="pill" />
        <RecordField label={fieldLabel('bienenvoelker', 'koenigin_herkunft')} value={record.fields.koenigin_herkunft} format="text" />
        <RecordField label={fieldLabel('bienenvoelker', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('bienenvoelker', 'standort')}
          name={standortTarget?.fields.strasse ?? '—'}
          meta={[standortTarget?.fields.kontakt_telefon].filter(Boolean).join(' · ') || undefined}
          onClick={standortTarget && onOpenStandorte ? () => onOpenStandorte!(standortTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('stockarbeiten')}
        items={stockarbeitenList.filter(r => extractRecordId(r.fields.volk) === record.record_id)}
        map={r => ({ name: r.fields.mittel ?? appLabel('stockarbeiten'), meta: r.fields.datum })}
        onOpen={onOpenStockarbeiten}
        onAdd={onAddStockarbeiten}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('honigernten')}
        items={honigerntenList.filter(r => extractRecordId(r.fields.volk) === record.record_id)}
        map={r => ({ name: r.fields.charge ?? appLabel('honigernten'), meta: r.fields.erntedatum })}
        onOpen={onOpenHonigernten}
        onAdd={onAddHonigernten}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BIENENVOELKER} recordId={record.record_id} readOnly={!perms.canWrite('bienenvoelker')} />
    </>
  );
}
