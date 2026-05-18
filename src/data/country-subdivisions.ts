/**
 * Per-country administrative subdivisions (state / province / region / il).
 *
 * Kullanım: kayıt formundaki "Şehir" alanı seçilen ülkeye göre dinamik liste
 * gösterir. Listede olmayan ülkeler için form free-text input'a düşer.
 *
 * Yeni ülke eklemek: SUBDIVISIONS map'ine bir satır ekle. Liste boyutu küçük
 * tutulmalı (ülkenin birinci-derece idari bölünmesi — eyalet/il/Bundesland).
 */

import { TR_CITIES } from "../utils/tr-validation";

/** ABD eyaletleri + Washington DC (51 kayıt). */
export const US_STATES: readonly string[] = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

/** ISO-2 ülke kodu → alt-bölge listesi. */
const SUBDIVISIONS: Record<string, readonly string[]> = {
  TR: TR_CITIES,
  US: US_STATES,
};

/**
 * ISO-2 koddan ülkenin alt-bölge listesini döndürür. Liste yoksa null.
 * Çağıran taraf null durumda free-text input'a düşmeli.
 */
export function getSubdivisionsForCountry(code: string): readonly string[] | null {
  return SUBDIVISIONS[code.toUpperCase()] || null;
}
