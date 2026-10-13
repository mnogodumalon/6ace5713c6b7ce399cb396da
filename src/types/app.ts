import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Standorte {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    koordinaten?: GeoLocation; // { lat, long, info }
    kontakt_vorname?: string;
    kontakt_nachname?: string;
    kontakt_telefon?: string;
    notizen?: string;
    bezeichnung?: string;
  };
}

export interface Bienenvoelker {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    volksname?: string;
    standort?: RecordUrl; // applookup -> URL zu 'Standorte' Record
    rasse?: LookupValue;
    beutentyp?: LookupValue;
    status?: LookupValue;
    einrichtungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    koenigin_baujahr?: number;
    koenigin_farbe?: LookupValue;
    koenigin_herkunft?: string;
    bemerkungen?: string;
  };
}

export interface Stockarbeiten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    volk?: RecordUrl; // applookup -> URL zu 'Bienenvoelker' Record
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    art?: LookupValue[];
    volksstaerke?: LookupValue;
    sanftmut?: LookupValue;
    brutbild?: LookupValue;
    weiselrichtig?: boolean;
    varroabefall?: number;
    mittel?: string;
    menge?: string;
    bemerkungen?: string;
  };
}

export interface Honigernten {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    volk?: RecordUrl; // applookup -> URL zu 'Bienenvoelker' Record
    honigsorte?: LookupValue;
    menge_kg?: number;
    wassergehalt?: number;
    anzahl_glaeser?: number;
    charge?: string;
    bemerkungen?: string;
    erntedatum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Honigverkaeufe {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    verkaufsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    ernte?: RecordUrl; // applookup -> URL zu 'Honigernten' Record
    kaeufer_vorname?: string;
    kaeufer_nachname?: string;
    gebindegroesse?: LookupValue;
    anzahl?: number;
    menge_kg?: number;
    preis_gesamt?: number;
    bezahlt?: boolean;
    bemerkungen?: string;
  };
}

export const APP_IDS = {
  STANDORTE: '6ace56f8bc246ed850a9a805',
  BIENENVOELKER: '6ace56fe04d5c011158188b4',
  STOCKARBEITEN: '6ace56ff8b48bed496926874',
  HONIGERNTEN: '6ace57015bc85adb469828af',
  HONIGVERKAEUFE: '6ace5702992a4200208f58dc',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'bienenvoelker': {
    rasse: [{ key: "buckfast", get label() { return lookupLabel('bienenvoelker', 'rasse', "buckfast") ?? "Buckfast"; } }, { key: "dunkle_biene", get label() { return lookupLabel('bienenvoelker', 'rasse', "dunkle_biene") ?? "Dunkle Biene"; } }, { key: "ligustica", get label() { return lookupLabel('bienenvoelker', 'rasse', "ligustica") ?? "Ligustica"; } }, { key: "mischling", get label() { return lookupLabel('bienenvoelker', 'rasse', "mischling") ?? "Mischling"; } }, { key: "unbekannt", get label() { return lookupLabel('bienenvoelker', 'rasse', "unbekannt") ?? "Unbekannt"; } }, { key: "carnica", get label() { return lookupLabel('bienenvoelker', 'rasse', "carnica") ?? "Carnica"; } }],
    beutentyp: [{ key: "zander", get label() { return lookupLabel('bienenvoelker', 'beutentyp', "zander") ?? "Zander"; } }, { key: "dadant", get label() { return lookupLabel('bienenvoelker', 'beutentyp', "dadant") ?? "Dadant"; } }, { key: "deutsch_normalmass", get label() { return lookupLabel('bienenvoelker', 'beutentyp', "deutsch_normalmass") ?? "Deutsch Normalmaß"; } }, { key: "langstroth", get label() { return lookupLabel('bienenvoelker', 'beutentyp', "langstroth") ?? "Langstroth"; } }, { key: "segeberger", get label() { return lookupLabel('bienenvoelker', 'beutentyp', "segeberger") ?? "Segeberger"; } }, { key: "sonstige", get label() { return lookupLabel('bienenvoelker', 'beutentyp', "sonstige") ?? "Sonstige"; } }],
    status: [{ key: "aktiv", get label() { return lookupLabel('bienenvoelker', 'status', "aktiv") ?? "Aktiv"; } }, { key: "ableger", get label() { return lookupLabel('bienenvoelker', 'status', "ableger") ?? "Ableger"; } }, { key: "eingewintert", get label() { return lookupLabel('bienenvoelker', 'status', "eingewintert") ?? "Eingewintert"; } }, { key: "aufgeloest", get label() { return lookupLabel('bienenvoelker', 'status', "aufgeloest") ?? "Aufgelöst"; } }],
    koenigin_farbe: [{ key: "weiss", get label() { return lookupLabel('bienenvoelker', 'koenigin_farbe', "weiss") ?? "Weiß (Jahre 1 und 6)"; } }, { key: "gelb", get label() { return lookupLabel('bienenvoelker', 'koenigin_farbe', "gelb") ?? "Gelb (Jahre 2 und 7)"; } }, { key: "gruen", get label() { return lookupLabel('bienenvoelker', 'koenigin_farbe', "gruen") ?? "Grün (Jahre 4 und 9)"; } }, { key: "blau", get label() { return lookupLabel('bienenvoelker', 'koenigin_farbe', "blau") ?? "Blau (Jahre 5 und 0)"; } }, { key: "ungezeichnet", get label() { return lookupLabel('bienenvoelker', 'koenigin_farbe', "ungezeichnet") ?? "Ungezeichnet"; } }, { key: "rot", get label() { return lookupLabel('bienenvoelker', 'koenigin_farbe', "rot") ?? "Rot (Jahre 3 und 8)"; } }],
  },
  'stockarbeiten': {
    art: [{ key: "durchsicht", get label() { return lookupLabel('stockarbeiten', 'art', "durchsicht") ?? "Durchsicht"; } }, { key: "behandlung", get label() { return lookupLabel('stockarbeiten', 'art', "behandlung") ?? "Behandlung"; } }, { key: "fuetterung", get label() { return lookupLabel('stockarbeiten', 'art', "fuetterung") ?? "Fütterung"; } }, { key: "erweiterung", get label() { return lookupLabel('stockarbeiten', 'art', "erweiterung") ?? "Erweiterung"; } }, { key: "sonstiges", get label() { return lookupLabel('stockarbeiten', 'art', "sonstiges") ?? "Sonstiges"; } }],
    volksstaerke: [{ key: "schwach", get label() { return lookupLabel('stockarbeiten', 'volksstaerke', "schwach") ?? "Schwach"; } }, { key: "mittel", get label() { return lookupLabel('stockarbeiten', 'volksstaerke', "mittel") ?? "Mittel"; } }, { key: "stark", get label() { return lookupLabel('stockarbeiten', 'volksstaerke', "stark") ?? "Stark"; } }],
    sanftmut: [{ key: "sehr_sanft", get label() { return lookupLabel('stockarbeiten', 'sanftmut', "sehr_sanft") ?? "Sehr sanft"; } }, { key: "sanft", get label() { return lookupLabel('stockarbeiten', 'sanftmut', "sanft") ?? "Sanft"; } }, { key: "maessig", get label() { return lookupLabel('stockarbeiten', 'sanftmut', "maessig") ?? "Mäßig"; } }, { key: "stechfreudig", get label() { return lookupLabel('stockarbeiten', 'sanftmut', "stechfreudig") ?? "Stechfreudig"; } }],
    brutbild: [{ key: "geschlossen", get label() { return lookupLabel('stockarbeiten', 'brutbild', "geschlossen") ?? "Geschlossen"; } }, { key: "lueckenhaft", get label() { return lookupLabel('stockarbeiten', 'brutbild', "lueckenhaft") ?? "Lückenhaft"; } }, { key: "keine_brut", get label() { return lookupLabel('stockarbeiten', 'brutbild', "keine_brut") ?? "Keine Brut"; } }],
  },
  'honigernten': {
    honigsorte: [{ key: "raps", get label() { return lookupLabel('honigernten', 'honigsorte', "raps") ?? "Raps"; } }, { key: "linde", get label() { return lookupLabel('honigernten', 'honigsorte', "linde") ?? "Linde"; } }, { key: "wald", get label() { return lookupLabel('honigernten', 'honigsorte', "wald") ?? "Wald"; } }, { key: "sommertracht", get label() { return lookupLabel('honigernten', 'honigsorte', "sommertracht") ?? "Sommertracht"; } }, { key: "sonstige", get label() { return lookupLabel('honigernten', 'honigsorte', "sonstige") ?? "Sonstige"; } }, { key: "fruehtracht", get label() { return lookupLabel('honigernten', 'honigsorte', "fruehtracht") ?? "Frühtracht"; } }],
  },
  'honigverkaeufe': {
    gebindegroesse: [{ key: "sonstige", get label() { return lookupLabel('honigverkaeufe', 'gebindegroesse', "sonstige") ?? "Sonstige"; } }, { key: "glas_250", get label() { return lookupLabel('honigverkaeufe', 'gebindegroesse', "glas_250") ?? "250 g Glas"; } }, { key: "glas_500", get label() { return lookupLabel('honigverkaeufe', 'gebindegroesse', "glas_500") ?? "500 g Glas"; } }, { key: "glas_1000", get label() { return lookupLabel('honigverkaeufe', 'gebindegroesse', "glas_1000") ?? "1000 g Glas"; } }, { key: "eimer", get label() { return lookupLabel('honigverkaeufe', 'gebindegroesse', "eimer") ?? "Eimer"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'standorte': {
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'koordinaten': 'geo',
    'kontakt_vorname': 'string/text',
    'kontakt_nachname': 'string/text',
    'kontakt_telefon': 'string/tel',
    'notizen': 'string/textarea',
    'bezeichnung': 'string/text',
  },
  'bienenvoelker': {
    'volksname': 'string/text',
    'standort': 'applookup/select',
    'rasse': 'lookup/select',
    'beutentyp': 'lookup/select',
    'status': 'lookup/radio',
    'einrichtungsdatum': 'date/date',
    'koenigin_baujahr': 'number',
    'koenigin_farbe': 'lookup/radio',
    'koenigin_herkunft': 'string/text',
    'bemerkungen': 'string/textarea',
  },
  'stockarbeiten': {
    'volk': 'applookup/select',
    'datum': 'date/datetimeminute',
    'art': 'multiplelookup/checkbox',
    'volksstaerke': 'lookup/select',
    'sanftmut': 'lookup/select',
    'brutbild': 'lookup/select',
    'weiselrichtig': 'bool',
    'varroabefall': 'number',
    'mittel': 'string/text',
    'menge': 'string/text',
    'bemerkungen': 'string/textarea',
  },
  'honigernten': {
    'volk': 'applookup/select',
    'honigsorte': 'lookup/select',
    'menge_kg': 'number',
    'wassergehalt': 'number',
    'anzahl_glaeser': 'number',
    'charge': 'string/text',
    'bemerkungen': 'string/textarea',
    'erntedatum': 'date/date',
  },
  'honigverkaeufe': {
    'verkaufsdatum': 'date/date',
    'ernte': 'applookup/select',
    'kaeufer_vorname': 'string/text',
    'kaeufer_nachname': 'string/text',
    'gebindegroesse': 'lookup/select',
    'anzahl': 'number',
    'menge_kg': 'number',
    'preis_gesamt': 'number',
    'bezahlt': 'bool',
    'bemerkungen': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateStandorte = StripLookup<Standorte['fields']>;
export type CreateBienenvoelker = StripLookup<Bienenvoelker['fields']>;
export type CreateStockarbeiten = StripLookup<Stockarbeiten['fields']>;
export type CreateHonigernten = StripLookup<Honigernten['fields']>;
export type CreateHonigverkaeufe = StripLookup<Honigverkaeufe['fields']>;