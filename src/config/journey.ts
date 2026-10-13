/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - standorte: no date pair, no references
 *   - bienenvoelker: applookups standort→standorte · lookups rasse[buckfast|dunkle_biene|ligustica|mischling|unbekannt|carnica], beutentyp[zander|dadant|deutsch_normalmass|langstroth|segeberger|sonstige], status[aktiv|ableger|eingewintert|aufgeloest], koenigin_farbe[weiss|gelb|gruen|blau|ungezeichnet|rot]
 *   - stockarbeiten: applookups volk→bienenvoelker · lookups volksstaerke[schwach|mittel|stark], sanftmut[sehr_sanft|sanft|maessig|stechfreudig], brutbild[geschlossen|lueckenhaft|keine_brut]
 *   - honigernten: applookups volk→bienenvoelker · lookups honigsorte[raps|linde|wald|sommertracht|sonstige|fruehtracht]
 *   - honigverkaeufe: applookups ernte→honigernten · lookups gebindegroesse[sonstige|glas_250|glas_500|glas_1000|eimer]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

/**
 * A record of the KEY entity is TAKEN while a record of `entity` points at it
 * through `field` — a slot with a booking, a seat with a ticket. Generated
 * from the plan's blocking `unique` check on that reference (05.10.2026:
 * the salon's public page offered booked slots again). Pickers on both
 * doors leave taken records out (useRecordSearch); a public page reads only
 * `field` of `entity` — never who booked. Generator-owned: no markers.
 */
export interface TakenRule {
  entity: EntityKey;
  field: string;
}

export const TAKEN_BY: Partial<Record<EntityKey, TakenRule>> = {
};
