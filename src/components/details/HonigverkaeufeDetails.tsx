import type { Honigverkaeufe, Honigernten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface HonigverkaeufeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Honigverkaeufe;
  /** N:1-Ziel „Honigernten": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  honigerntenList: Honigernten[];
  /** Klick auf die Honigernten-Relation → overlay.push auf dessen Detail. */
  onOpenHonigernten?: (record: Honigernten) => void;
}

export function HonigverkaeufeDetails({
  record,
  honigerntenList,
  onOpenHonigernten,
}: HonigverkaeufeDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const ernteTarget = honigerntenList.find(r => r.record_id === extractRecordId(record.fields.ernte));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('honigverkaeufe', 'verkaufsdatum')} value={record.fields.verkaufsdatum} format="date" />
        <RecordField label={fieldLabel('honigverkaeufe', 'kaeufer_vorname')} value={record.fields.kaeufer_vorname} format="text" />
        <RecordField label={fieldLabel('honigverkaeufe', 'kaeufer_nachname')} value={record.fields.kaeufer_nachname} format="text" />
        <RecordField label={fieldLabel('honigverkaeufe', 'gebindegroesse')} value={record.fields.gebindegroesse} format="pill" />
        <RecordField label={fieldLabel('honigverkaeufe', 'anzahl')} value={record.fields.anzahl} format="text" />
        <RecordField label={fieldLabel('honigverkaeufe', 'menge_kg')} value={record.fields.menge_kg} format="text" />
        <RecordField label={fieldLabel('honigverkaeufe', 'preis_gesamt')} value={record.fields.preis_gesamt} format="text" />
        <RecordField label={fieldLabel('honigverkaeufe', 'bezahlt')} value={record.fields.bezahlt} format="bool" />
        <RecordField label={fieldLabel('honigverkaeufe', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('honigverkaeufe', 'ernte')}
          name={ernteTarget?.fields.charge ?? '—'}
          meta={undefined}
          onClick={ernteTarget && onOpenHonigernten ? () => onOpenHonigernten!(ernteTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.HONIGVERKAEUFE} recordId={record.record_id} readOnly={!perms.canWrite('honigverkaeufe')} />
    </>
  );
}
