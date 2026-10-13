import type { Honigernten, Bienenvoelker, Honigverkaeufe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface HonigerntenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Honigernten;
  /** N:1-Ziel „Bienenvoelker": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  bienenvoelkerList: Bienenvoelker[];
  /** Klick auf die Bienenvoelker-Relation → overlay.push auf dessen Detail. */
  onOpenBienenvoelker?: (record: Bienenvoelker) => void;
  /** 1:N „Honigverkäufe" (ernte): VOLLE Liste — der Block filtert auf diesen Record. */
  honigverkaeufeList: Honigverkaeufe[];
  /** Zeilen-Klick → overlay.push auf das Honigverkaeufe-Detail (nie der Edit-Dialog). */
  onOpenHonigverkaeufe: (record: Honigverkaeufe) => void;
  /** Kontextuelles „+": öffnet den Honigverkaeufe-Dialog mit diesem Record vorgesetzt. */
  onAddHonigverkaeufe?: () => void;
}

export function HonigerntenDetails({
  record,
  bienenvoelkerList,
  onOpenBienenvoelker,
  honigverkaeufeList,
  onOpenHonigverkaeufe,
  onAddHonigverkaeufe,
}: HonigerntenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const volkTarget = bienenvoelkerList.find(r => r.record_id === extractRecordId(record.fields.volk));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('honigernten', 'honigsorte')} value={record.fields.honigsorte} format="pill" />
        <RecordField label={fieldLabel('honigernten', 'menge_kg')} value={record.fields.menge_kg} format="text" />
        <RecordField label={fieldLabel('honigernten', 'wassergehalt')} value={record.fields.wassergehalt} format="text" />
        <RecordField label={fieldLabel('honigernten', 'anzahl_glaeser')} value={record.fields.anzahl_glaeser} format="text" />
        <RecordField label={fieldLabel('honigernten', 'charge')} value={record.fields.charge} format="text" />
        <RecordField label={fieldLabel('honigernten', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('honigernten', 'erntedatum')} value={record.fields.erntedatum} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('honigernten', 'volk')}
          name={volkTarget?.fields.volksname ?? '—'}
          meta={[volkTarget?.fields.koenigin_herkunft].filter(Boolean).join(' · ') || undefined}
          onClick={volkTarget && onOpenBienenvoelker ? () => onOpenBienenvoelker!(volkTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('honigverkaeufe')}
        items={honigverkaeufeList.filter(r => extractRecordId(r.fields.ernte) === record.record_id)}
        map={r => ({ name: r.fields.kaeufer_vorname ?? appLabel('honigverkaeufe'), meta: r.fields.verkaufsdatum })}
        onOpen={onOpenHonigverkaeufe}
        onAdd={onAddHonigverkaeufe}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.HONIGERNTEN} recordId={record.record_id} readOnly={!perms.canWrite('honigernten')} />
    </>
  );
}
