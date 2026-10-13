import type { EnrichedBienenvoelker, EnrichedHonigernten, EnrichedHonigverkaeufe, EnrichedStockarbeiten } from '@/types/enriched';
import type { Bienenvoelker, Honigernten, Honigverkaeufe, Standorte, Stockarbeiten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface BienenvoelkerMaps {
  standorteMap: Map<string, Standorte>;
}

export function enrichBienenvoelker(
  bienenvoelker: Bienenvoelker[],
  maps: BienenvoelkerMaps
): EnrichedBienenvoelker[] {
  return bienenvoelker.map(r => ({
    ...r,
    standortName: resolveDisplay(r.fields.standort, maps.standorteMap, 'strasse'),
  }));
}

interface StockarbeitenMaps {
  bienenvoelkerMap: Map<string, Bienenvoelker>;
}

export function enrichStockarbeiten(
  stockarbeiten: Stockarbeiten[],
  maps: StockarbeitenMaps
): EnrichedStockarbeiten[] {
  return stockarbeiten.map(r => ({
    ...r,
    volkName: resolveDisplay(r.fields.volk, maps.bienenvoelkerMap, 'volksname'),
  }));
}

interface HonigerntenMaps {
  bienenvoelkerMap: Map<string, Bienenvoelker>;
}

export function enrichHonigernten(
  honigernten: Honigernten[],
  maps: HonigerntenMaps
): EnrichedHonigernten[] {
  return honigernten.map(r => ({
    ...r,
    volkName: resolveDisplay(r.fields.volk, maps.bienenvoelkerMap, 'volksname'),
  }));
}

interface HonigverkaeufeMaps {
  honigerntenMap: Map<string, Honigernten>;
}

export function enrichHonigverkaeufe(
  honigverkaeufe: Honigverkaeufe[],
  maps: HonigverkaeufeMaps
): EnrichedHonigverkaeufe[] {
  return honigverkaeufe.map(r => ({
    ...r,
    ernteName: resolveDisplay(r.fields.ernte, maps.honigerntenMap, 'charge'),
  }));
}
