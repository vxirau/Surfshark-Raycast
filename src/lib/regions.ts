import { AUTO_REGION, Region } from "../types";

const SERVER_LIST_URL = "https://serverlist.piaservers.net/vpninfo/servers/v6";

interface ApiRegion {
  id: string;
  name: string;
  country: string;
  auto_region?: boolean;
  port_forward?: boolean;
  geo?: boolean;
  offline?: boolean;
}

/**
 * piactl's region ids are the catalog display names lowercased and hyphenated
 * ("US New York" -> "us-new-york"). The API's own `id` field uses a different
 * scheme, so the name is the only reliable join key — verified to match all 166
 * ids piactl reports.
 */
export function toRegionId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string): string {
  try {
    return countryNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export function flagUrl(countryCode: string): string {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}

export const AUTO_REGION_ENTRY: Region = {
  id: AUTO_REGION,
  name: "Automatic",
  countryCode: "",
  country: "Fastest available region",
  portForward: false,
  geo: false,
  autoRegion: true,
  offline: false,
};

/**
 * Fetch PIA's public server catalog. The response body is JSON followed by a
 * signature block, so only the first line is parsed.
 */
export async function fetchRegions(): Promise<Region[]> {
  const res = await fetch(SERVER_LIST_URL);
  if (!res.ok) {
    throw new Error(`PIA server list request failed: ${res.status}`);
  }
  const body = await res.text();
  const payload = JSON.parse(body.split("\n")[0]) as { regions: ApiRegion[] };

  return payload.regions
    .filter((r) => r.name && r.country)
    .map((r) => ({
      id: toRegionId(r.name),
      name: r.name,
      countryCode: r.country.toUpperCase(),
      country: countryName(r.country),
      portForward: !!r.port_forward,
      geo: !!r.geo,
      autoRegion: !!r.auto_region,
      offline: !!r.offline,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const FAVORITES_KEY = "favorite_regions";
export const RECENTS_KEY = "recent_regions";
