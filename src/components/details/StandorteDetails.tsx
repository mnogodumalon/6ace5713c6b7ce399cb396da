import type { Standorte, Bienenvoelker } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MapRouteLinks } from '@/components/widgets/MapWidget';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface StandorteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Standorte;
  /** 1:N „Bienenvölker" (standort): VOLLE Liste — der Block filtert auf diesen Record. */
  bienenvoelkerList: Bienenvoelker[];
  /** Zeilen-Klick → overlay.push auf das Bienenvoelker-Detail (nie der Edit-Dialog). */
  onOpenBienenvoelker: (record: Bienenvoelker) => void;
  /** Kontextuelles „+": öffnet den Bienenvoelker-Dialog mit diesem Record vorgesetzt. */
  onAddBienenvoelker?: () => void;
}

export function StandorteDetails({
  record,
  bienenvoelkerList,
  onOpenBienenvoelker,
  onAddBienenvoelker,
}: StandorteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('standorte', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('standorte', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('standorte', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('standorte', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('standorte', 'koordinaten')}>
          {record.fields.koordinaten ? (
            <div className="space-y-1">
              <div>{record.fields.koordinaten.info ?? `${record.fields.koordinaten.lat}, ${record.fields.koordinaten.long}`}</div>
              {/* Directions links — the map popup is hover-fleeting; the overlay
                  is the only mobile-reachable place for navigation. */}
              <MapRouteLinks lat={record.fields.koordinaten.lat} long={record.fields.koordinaten.long} />
            </div>
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('standorte', 'kontakt_vorname')} value={record.fields.kontakt_vorname} format="text" />
        <RecordField label={fieldLabel('standorte', 'kontakt_nachname')} value={record.fields.kontakt_nachname} format="text" />
        <RecordField label={fieldLabel('standorte', 'kontakt_telefon')} value={record.fields.kontakt_telefon} format="text" />
        <RecordField label={fieldLabel('standorte', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('standorte', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('bienenvoelker')}
        items={bienenvoelkerList.filter(r => extractRecordId(r.fields.standort) === record.record_id)}
        map={r => ({ name: r.fields.volksname ?? appLabel('bienenvoelker'), meta: r.fields.einrichtungsdatum })}
        onOpen={onOpenBienenvoelker}
        onAdd={onAddBienenvoelker}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.STANDORTE} recordId={record.record_id} readOnly={!perms.canWrite('standorte')} />
    </>
  );
}
