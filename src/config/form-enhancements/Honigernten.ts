// Auto-generated. Per-entity form-enhancements config for "Honigernten".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["charge", {"row": ["volk", "honigsorte"], "cols": "1fr 1fr"}, "erntedatum", {"row": ["menge_kg", "wassergehalt"], "cols": "1fr 1fr"}, "anzahl_glaeser", "bemerkungen"],
  defaults: {
    'erntedatum': { kind: 'today' },
  },
  computed: {},
  numberFields: {
    'wassergehalt': { max: 100 },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
