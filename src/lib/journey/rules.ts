/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'standorte' | 'bienenvoelker' | 'stockarbeiten' | 'honigernten' | 'honigverkaeufe';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "standorte": "strasse" | "hausnummer" | "plz" | "ort" | "kontakt_vorname" | "kontakt_nachname" | "kontakt_telefon" | "notizen" | "bezeichnung";
  "bienenvoelker": "volksname" | "koenigin_herkunft" | "bemerkungen";
  "stockarbeiten": "mittel" | "menge" | "bemerkungen";
  "honigernten": "charge" | "bemerkungen";
  "honigverkaeufe": "kaeufer_vorname" | "kaeufer_nachname" | "bemerkungen";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "standorte": never;
  "bienenvoelker": "standort";
  "stockarbeiten": "volk";
  "honigernten": "volk";
  "honigverkaeufe": "ernte";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "standorte": {
    "key": "standorte",
    "appId": "6ace56f8bc246ed850a9a805",
    "label": "Standorte",
    "pascal": "Standorte",
    "single": "StandorteEntry"
  },
  "bienenvoelker": {
    "key": "bienenvoelker",
    "appId": "6ace56fe04d5c011158188b4",
    "label": "Bienenvölker",
    "pascal": "Bienenvoelker",
    "single": "BienenvoelkerEntry"
  },
  "stockarbeiten": {
    "key": "stockarbeiten",
    "appId": "6ace56ff8b48bed496926874",
    "label": "Stockarbeiten",
    "pascal": "Stockarbeiten",
    "single": "StockarbeitenEntry"
  },
  "honigernten": {
    "key": "honigernten",
    "appId": "6ace57015bc85adb469828af",
    "label": "Honigernten",
    "pascal": "Honigernten",
    "single": "HonigerntenEntry"
  },
  "honigverkaeufe": {
    "key": "honigverkaeufe",
    "appId": "6ace5702992a4200208f58dc",
    "label": "Honigverkäufe",
    "pascal": "Honigverkaeufe",
    "single": "HonigverkaeufeEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "standorte": {
    "strasse": {
      "key": "strasse",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Straße",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-line1"
    },
    "hausnummer": {
      "key": "hausnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Hausnummer",
      "writable": true,
      "maxLength": 4000
    },
    "plz": {
      "key": "plz",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Postleitzahl",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "postal-code"
    },
    "ort": {
      "key": "ort",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Ort",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "address-level2"
    },
    "koordinaten": {
      "key": "koordinaten",
      "fulltype": "geo",
      "kind": "geo",
      "required": false,
      "label": "Standort auf der Karte",
      "writable": true
    },
    "kontakt_vorname": {
      "key": "kontakt_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "kontakt_nachname": {
      "key": "kontakt_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "kontakt_telefon": {
      "key": "kontakt_telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon",
      "writable": true,
      "autoComplete": "tel"
    },
    "notizen": {
      "key": "notizen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Notizen",
      "writable": true
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung des Standorts",
      "writable": true,
      "maxLength": 4000
    }
  },
  "bienenvoelker": {
    "volksname": {
      "key": "volksname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Volksnummer oder Name",
      "writable": true,
      "maxLength": 4000
    },
    "standort": {
      "key": "standort",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Standort",
      "writable": true,
      "targetAppId": "6ace56f8bc246ed850a9a805",
      "targetEntity": "standorte"
    },
    "rasse": {
      "key": "rasse",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Bienenrasse",
      "writable": true,
      "options": [
        "buckfast",
        "dunkle_biene",
        "ligustica",
        "mischling",
        "unbekannt",
        "carnica"
      ]
    },
    "beutentyp": {
      "key": "beutentyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Beutentyp",
      "writable": true,
      "options": [
        "zander",
        "dadant",
        "deutsch_normalmass",
        "langstroth",
        "segeberger",
        "sonstige"
      ]
    },
    "status": {
      "key": "status",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "aktiv",
        "ableger",
        "eingewintert",
        "aufgeloest"
      ]
    },
    "einrichtungsdatum": {
      "key": "einrichtungsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Datum der Einrichtung",
      "writable": true
    },
    "koenigin_baujahr": {
      "key": "koenigin_baujahr",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Baujahr der Königin",
      "writable": true
    },
    "koenigin_farbe": {
      "key": "koenigin_farbe",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Zeichnungsfarbe",
      "writable": true,
      "options": [
        "weiss",
        "gelb",
        "gruen",
        "blau",
        "ungezeichnet",
        "rot"
      ]
    },
    "koenigin_herkunft": {
      "key": "koenigin_herkunft",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Herkunft der Königin",
      "writable": true,
      "maxLength": 4000
    },
    "bemerkungen": {
      "key": "bemerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkungen",
      "writable": true
    }
  },
  "stockarbeiten": {
    "volk": {
      "key": "volk",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Volk",
      "writable": true,
      "targetAppId": "6ace56fe04d5c011158188b4",
      "targetEntity": "bienenvoelker"
    },
    "datum": {
      "key": "datum",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Datum und Uhrzeit",
      "writable": true
    },
    "art": {
      "key": "art",
      "fulltype": "multiplelookup/checkbox",
      "kind": "multilookup",
      "required": true,
      "label": "Art der Arbeit",
      "writable": true,
      "options": [
        "durchsicht",
        "behandlung",
        "fuetterung",
        "erweiterung",
        "sonstiges"
      ]
    },
    "volksstaerke": {
      "key": "volksstaerke",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Volksstärke",
      "writable": true,
      "options": [
        "schwach",
        "mittel",
        "stark"
      ]
    },
    "sanftmut": {
      "key": "sanftmut",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Sanftmut",
      "writable": true,
      "options": [
        "sehr_sanft",
        "sanft",
        "maessig",
        "stechfreudig"
      ]
    },
    "brutbild": {
      "key": "brutbild",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Brutbild",
      "writable": true,
      "options": [
        "geschlossen",
        "lueckenhaft",
        "keine_brut"
      ]
    },
    "weiselrichtig": {
      "key": "weiselrichtig",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Weiselrichtig (Königin vorhanden, Stifte gesehen)",
      "writable": true
    },
    "varroabefall": {
      "key": "varroabefall",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Varroabefall (Milben pro Tag)",
      "writable": true
    },
    "mittel": {
      "key": "mittel",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Medikament oder Futter",
      "writable": true,
      "maxLength": 4000
    },
    "menge": {
      "key": "menge",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Menge",
      "writable": true,
      "maxLength": 4000
    },
    "bemerkungen": {
      "key": "bemerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkungen",
      "writable": true
    }
  },
  "honigernten": {
    "volk": {
      "key": "volk",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Volk",
      "writable": true,
      "targetAppId": "6ace56fe04d5c011158188b4",
      "targetEntity": "bienenvoelker"
    },
    "honigsorte": {
      "key": "honigsorte",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Honigsorte",
      "writable": true,
      "options": [
        "raps",
        "linde",
        "wald",
        "sommertracht",
        "sonstige",
        "fruehtracht"
      ]
    },
    "menge_kg": {
      "key": "menge_kg",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Menge in kg",
      "writable": true
    },
    "wassergehalt": {
      "key": "wassergehalt",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Wassergehalt in Prozent",
      "writable": true
    },
    "anzahl_glaeser": {
      "key": "anzahl_glaeser",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Anzahl Gläser",
      "writable": true
    },
    "charge": {
      "key": "charge",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Chargennummer",
      "writable": true,
      "maxLength": 4000
    },
    "bemerkungen": {
      "key": "bemerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkungen",
      "writable": true
    },
    "erntedatum": {
      "key": "erntedatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Erntedatum",
      "writable": true
    }
  },
  "honigverkaeufe": {
    "verkaufsdatum": {
      "key": "verkaufsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Verkaufsdatum",
      "writable": true
    },
    "ernte": {
      "key": "ernte",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": false,
      "label": "Honigernte",
      "writable": true,
      "targetAppId": "6ace57015bc85adb469828af",
      "targetEntity": "honigernten"
    },
    "kaeufer_vorname": {
      "key": "kaeufer_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Vorname des Käufers",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "kaeufer_nachname": {
      "key": "kaeufer_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nachname des Käufers",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "gebindegroesse": {
      "key": "gebindegroesse",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": false,
      "label": "Gebindegröße",
      "writable": true,
      "options": [
        "sonstige",
        "glas_250",
        "glas_500",
        "glas_1000",
        "eimer"
      ]
    },
    "anzahl": {
      "key": "anzahl",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Anzahl",
      "writable": true
    },
    "menge_kg": {
      "key": "menge_kg",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Gesamtmenge in kg",
      "writable": true
    },
    "preis_gesamt": {
      "key": "preis_gesamt",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Gesamtpreis in Euro",
      "writable": true,
      "format": "currency"
    },
    "bezahlt": {
      "key": "bezahlt",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Bezahlt",
      "writable": true
    },
    "bemerkungen": {
      "key": "bemerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkungen",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "standorte": [],
  "bienenvoelker": [
    {
      "kind": "choice",
      "field": "rasse",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "beutentyp",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "status",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "koenigin_farbe",
      "count": 6
    },
    {
      "kind": "record",
      "field": "standort",
      "targetEntity": "standorte"
    }
  ],
  "stockarbeiten": [
    {
      "kind": "choice",
      "field": "volksstaerke",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "sanftmut",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "brutbild",
      "count": 3
    },
    {
      "kind": "record",
      "field": "volk",
      "targetEntity": "bienenvoelker"
    }
  ],
  "honigernten": [
    {
      "kind": "choice",
      "field": "honigsorte",
      "count": 6
    },
    {
      "kind": "record",
      "field": "volk",
      "targetEntity": "bienenvoelker"
    }
  ],
  "honigverkaeufe": [
    {
      "kind": "choice",
      "field": "gebindegroesse",
      "count": 5
    },
    {
      "kind": "record",
      "field": "ernte",
      "targetEntity": "honigernten"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "standorte": [
    "strasse"
  ],
  "bienenvoelker": [
    "volksname"
  ],
  "stockarbeiten": [
    "mittel"
  ],
  "honigernten": [
    "charge"
  ],
  "honigverkaeufe": [
    "kaeufer_vorname"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
