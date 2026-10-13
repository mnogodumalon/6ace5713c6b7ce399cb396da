// Auto-generated. Per-entity form-enhancements config for "Bienenvölker".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["volksname", "standort", "status", {"row": ["rasse", "beutentyp"], "cols": "1fr 1fr"}, "einrichtungsdatum", {"row": ["koenigin_baujahr", "koenigin_farbe"], "cols": "1fr 2fr"}, "koenigin_herkunft", "bemerkungen"],
  defaults: {
    'status': { kind: 'lookup', key: 'aktiv', label: 'Aktiv' },
    'einrichtungsdatum': { kind: 'today' },
    'koenigin_baujahr': { kind: 'currentYear' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
