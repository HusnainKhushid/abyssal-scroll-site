/**
 * All page copy. Index-aligned with PRESETS in lib/field.ts — section i
 * is told by SECTIONS[i] and rendered by PRESETS[i].
 */

export type SectionLayout = "corner" | "left" | "centre" | "closer";

export interface SectionContent {
  id: string;
  /** roman numeral shown in the section label */
  numeral: string;
  /** SEC.00N */
  code: string;
  /** short name for the nav and the section label */
  name: string;
  /** explicit line breaks — display type is set, not flowed */
  title: string[];
  /** small right-hand caption */
  note: string;
  /** micro-label under the headline */
  stat?: string;
  cta?: string;
  layout: SectionLayout;
  /** approximate depth in metres, for the depth readout */
  depth: number;
  /** closer only: lines that cross-fade as you scroll through */
  lines?: string[];
}

export const BRAND = "Abyssal";
export const WORDMARK = "(ABYSSAL)";
export const MOTTO = "[ LEAVE IT DARK ]";

export const SECTIONS: SectionContent[] = [
  {
    id: "dark",
    numeral: "I",
    code: "SEC.001",
    name: "The dark",
    title: ["MOST OF", "THE PLANET", "HAS NEVER SEEN", "THE SUN."],
    note: "Below two hundred metres, sunlight stops. What is left is the largest habitat on Earth, and the least surveyed — we have better maps of Mars.",
    stat: "[ 200 M — LIGHT ENDS ]",
    cta: "Read the survey",
    layout: "corner",
    depth: 200,
  },
  {
    id: "pressure",
    numeral: "II",
    code: "SEC.002",
    name: "Pressure",
    title: ["FOUR HUNDRED", "ATMOSPHERES.", "AND SOMETHING", "STILL LIVES."],
    note: "At four kilometres down the water pushes with the weight of a car on every thumbnail. Life did not merely survive that. It specialised into it.",
    stat: "[ 4,000 M — 400 ATM ]",
    layout: "corner",
    depth: 4000,
  },
  {
    id: "light",
    numeral: "III",
    code: "SEC.003",
    name: "Light",
    title: ["NINE IN TEN", "MAKE THEIR", "OWN LIGHT."],
    note: "Bioluminescence is not the exception down here. It is the default — the most common form of communication on the planet, and we have decoded almost none of it.",
    stat: "[ 90% — BIOLUMINESCENT ]",
    layout: "left",
    depth: 1000,
  },
  {
    id: "fall",
    numeral: "IV",
    code: "SEC.004",
    name: "The fall",
    title: ["ONE WHALE", "FEEDS A CITY", "FOR FIFTY YEARS."],
    note: "A carcass reaching the seabed becomes an ecosystem. Scavengers, then bone-eating worms, then bacterial mats — a full succession, running on one animal, for half a century.",
    stat: "[ 1 FALL — 50 YEARS ]",
    layout: "left",
    depth: 3000,
  },
  {
    id: "machines",
    numeral: "V",
    code: "SEC.005",
    name: "The machines",
    title: ["WE ARE", "ABOUT TO", "MINE IT."],
    note: "Nodule collectors strip the top ten centimetres of seabed and return the tailings as a plume. The sediment they lift settles over an area far larger than the one they cut.",
    stat: "[ 1.5 M KM² — LICENSED ]",
    cta: "See the licence map",
    layout: "corner",
    depth: 5000,
  },
  {
    id: "hold",
    numeral: "VI",
    code: "SEC.006",
    name: "Hold",
    title: ["NOTHING", "HAS TO HAPPEN", "YET."],
    note: "Thirty-eight states now back a moratorium until the science is in. Not a ban — a pause, long enough to find out what is actually down there before it is gone.",
    stat: "[ 38 STATES — MORATORIUM ]",
    cta: "Add your name",
    layout: "centre",
    depth: 6000,
  },
  {
    id: "current",
    numeral: "VII",
    code: "SEC.007",
    name: "Current",
    title: [],
    note: "",
    layout: "closer",
    depth: 6000,
    lines: [
      "Most of the planet has never seen the sun.",
      "It is not empty.",
      "Leave it dark.",
    ],
  },
];

export const FOOTER_COLUMNS = [
  { title: "Survey", links: ["Method", "Datasets", "Bathymetry", "Sources"] },
  { title: "Policy", links: ["Moratorium", "ISA tracker", "Licences", "Briefings"] },
  { title: "Contact", links: ["Press", "Researchers", "Newsletter", "Donate"] },
];
