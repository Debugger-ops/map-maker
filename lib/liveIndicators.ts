/**
 * Catalogue of free World Bank indicators available for live data fetching.
 * All indicators work with the /api/worldbank route — no API key needed.
 *
 * Source: https://data.worldbank.org/indicator
 */

export interface LiveIndicator {
  id: string;          // World Bank indicator code
  name: string;        // Short display name
  description: string; // One-line explanation
  unit: string;        // Display unit
  category: IndicatorCategory;
  scope: "world";      // All WB indicators are world-scope for now
  defaultYear: number; // Best year with high data coverage
  higherIsBetter?: boolean; // For legend hints
}

export type IndicatorCategory =
  | "Economy"
  | "Population"
  | "Health"
  | "Education"
  | "Environment"
  | "Technology"
  | "Governance";

export const LIVE_INDICATORS: LiveIndicator[] = [
  // ── Economy ─────────────────────────────────────────────────────────
  {
    id: "NY.GDP.MKTP.CD",
    name: "GDP (Total)",
    description: "Gross Domestic Product in current US dollars",
    unit: "USD",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: true,
  },
  {
    id: "NY.GDP.PCAP.CD",
    name: "GDP per Capita",
    description: "GDP divided by population — a key living-standard indicator",
    unit: "USD / person",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: true,
  },
  {
    id: "NY.GNP.PCAP.CD",
    name: "GNI per Capita",
    description: "Gross National Income per person (Atlas method, current USD)",
    unit: "USD / person",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: true,
  },
  {
    id: "FP.CPI.TOTL.ZG",
    name: "Inflation Rate",
    description: "Annual % change in consumer price index",
    unit: "%",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: false,
  },
  {
    id: "SL.UEM.TOTL.ZS",
    name: "Unemployment Rate",
    description: "% of total labor force that is unemployed",
    unit: "%",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: false,
  },
  {
    id: "NE.TRD.GNFS.ZS",
    name: "Trade (% GDP)",
    description: "Sum of exports and imports as % of GDP",
    unit: "% of GDP",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
  },
  {
    id: "GC.DOD.TOTL.GD.ZS",
    name: "Government Debt",
    description: "Central government debt as % of GDP",
    unit: "% of GDP",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: false,
  },
  {
    id: "SI.POV.GINI",
    name: "Gini Inequality Index",
    description: "Measures income inequality — 0 = perfect equality, 100 = total inequality",
    unit: "index",
    category: "Economy",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: false,
  },
  {
    id: "SI.POV.NAHC",
    name: "Poverty Rate",
    description: "% of population below national poverty line",
    unit: "%",
    category: "Economy",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: false,
  },
  {
    id: "BX.KLT.DINV.CD.WD",
    name: "Foreign Direct Investment",
    description: "Net inflows of FDI (BoP, current USD)",
    unit: "USD",
    category: "Economy",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: true,
  },

  // ── Population ───────────────────────────────────────────────────────
  {
    id: "SP.POP.TOTL",
    name: "Total Population",
    description: "Total population count",
    unit: "people",
    category: "Population",
    scope: "world",
    defaultYear: 2022,
  },
  {
    id: "SP.POP.GROW",
    name: "Population Growth",
    description: "Annual population growth rate (%)",
    unit: "%",
    category: "Population",
    scope: "world",
    defaultYear: 2022,
  },
  {
    id: "SP.URB.TOTL.IN.ZS",
    name: "Urban Population",
    description: "% of population living in urban areas",
    unit: "%",
    category: "Population",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: true,
  },
  {
    id: "SP.DYN.TFRT.IN",
    name: "Fertility Rate",
    description: "Average number of children born per woman",
    unit: "children / woman",
    category: "Population",
    scope: "world",
    defaultYear: 2021,
  },
  {
    id: "SP.POP.65UP.TO.ZS",
    name: "Aging Population (65+)",
    description: "% of population aged 65 and above",
    unit: "%",
    category: "Population",
    scope: "world",
    defaultYear: 2022,
  },

  // ── Health ───────────────────────────────────────────────────────────
  {
    id: "SP.DYN.LE00.IN",
    name: "Life Expectancy",
    description: "Average life expectancy at birth (years)",
    unit: "years",
    category: "Health",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: true,
  },
  {
    id: "SH.DYN.MORT",
    name: "Child Mortality",
    description: "Under-5 mortality rate per 1,000 live births",
    unit: "per 1,000 births",
    category: "Health",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: false,
  },
  {
    id: "SP.DYN.IMRT.IN",
    name: "Infant Mortality",
    description: "Deaths of infants under 1 per 1,000 live births",
    unit: "per 1,000 births",
    category: "Health",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: false,
  },
  {
    id: "SH.XPD.CHEX.GD.ZS",
    name: "Health Expenditure",
    description: "Current health expenditure as % of GDP",
    unit: "% of GDP",
    category: "Health",
    scope: "world",
    defaultYear: 2020,
    higherIsBetter: true,
  },
  {
    id: "SH.STA.OWAD.ZS",
    name: "Overweight Adults",
    description: "% of adults (18+) who are overweight",
    unit: "%",
    category: "Health",
    scope: "world",
    defaultYear: 2016,
  },

  // ── Education ────────────────────────────────────────────────────────
  {
    id: "SE.ADT.LITR.ZS",
    name: "Adult Literacy Rate",
    description: "% of adults (15+) who can read and write",
    unit: "%",
    category: "Education",
    scope: "world",
    defaultYear: 2020,
    higherIsBetter: true,
  },
  {
    id: "SE.TER.ENRR",
    name: "Tertiary Education Enrolment",
    description: "% of tertiary school-age population enrolled in higher education",
    unit: "%",
    category: "Education",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: true,
  },
  {
    id: "SE.XPD.TOTL.GD.ZS",
    name: "Education Spending",
    description: "Government expenditure on education as % of GDP",
    unit: "% of GDP",
    category: "Education",
    scope: "world",
    defaultYear: 2020,
    higherIsBetter: true,
  },

  // ── Environment ──────────────────────────────────────────────────────
  {
    id: "EN.ATM.CO2E.PC",
    name: "CO₂ Emissions per Capita",
    description: "Metric tons of CO₂ emitted per person per year",
    unit: "t CO₂ / person",
    category: "Environment",
    scope: "world",
    defaultYear: 2020,
    higherIsBetter: false,
  },
  {
    id: "AG.LND.FRST.ZS",
    name: "Forest Cover",
    description: "Forest area as % of total land area",
    unit: "%",
    category: "Environment",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: true,
  },
  {
    id: "EG.ELC.RNEW.ZS",
    name: "Renewable Electricity",
    description: "Renewable energy as % of total electricity output",
    unit: "%",
    category: "Environment",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: true,
  },
  {
    id: "EG.USE.PCAP.KG.OE",
    name: "Energy Use per Capita",
    description: "Energy use in kg of oil equivalent per person",
    unit: "kg oil eq. / person",
    category: "Environment",
    scope: "world",
    defaultYear: 2015,
  },
  {
    id: "ER.H2O.FWTL.ZS",
    name: "Freshwater Withdrawal",
    description: "Annual freshwater withdrawals as % of internal resources",
    unit: "%",
    category: "Environment",
    scope: "world",
    defaultYear: 2017,
  },

  // ── Technology ───────────────────────────────────────────────────────
  {
    id: "IT.NET.USER.ZS",
    name: "Internet Users",
    description: "% of population that uses the internet",
    unit: "%",
    category: "Technology",
    scope: "world",
    defaultYear: 2021,
    higherIsBetter: true,
  },
  {
    id: "IT.CEL.SETS.P2",
    name: "Mobile Subscriptions",
    description: "Mobile cellular subscriptions per 100 people",
    unit: "per 100 people",
    category: "Technology",
    scope: "world",
    defaultYear: 2021,
  },

  // ── Governance ───────────────────────────────────────────────────────
  {
    id: "MS.MIL.XPND.GD.ZS",
    name: "Military Expenditure",
    description: "Military spending as % of GDP",
    unit: "% of GDP",
    category: "Governance",
    scope: "world",
    defaultYear: 2022,
  },
  {
    id: "GE.EST",
    name: "Government Effectiveness",
    description: "World Bank governance indicator: government effectiveness (−2.5 to +2.5)",
    unit: "score",
    category: "Governance",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: true,
  },
  {
    id: "CC.EST",
    name: "Control of Corruption",
    description: "World Bank governance indicator: control of corruption (−2.5 to +2.5)",
    unit: "score",
    category: "Governance",
    scope: "world",
    defaultYear: 2022,
    higherIsBetter: true,
  },
];

/** All unique categories in display order. */
export const INDICATOR_CATEGORIES: IndicatorCategory[] = [
  "Economy",
  "Population",
  "Health",
  "Education",
  "Environment",
  "Technology",
  "Governance",
];

/** Emoji badge for each category. */
export const CATEGORY_EMOJI: Record<IndicatorCategory, string> = {
  Economy:    "💰",
  Population: "👥",
  Health:     "🏥",
  Education:  "📚",
  Environment:"🌿",
  Technology: "📡",
  Governance: "⚖️",
};

/** Find an indicator by its World Bank ID. */
export function findIndicator(id: string): LiveIndicator | undefined {
  return LIVE_INDICATORS.find((i) => i.id === id);
}

/** Get all indicators for a given category. */
export function indicatorsByCategory(cat: IndicatorCategory): LiveIndicator[] {
  return LIVE_INDICATORS.filter((i) => i.category === cat);
}

/**
 * Given a free-text user query, try to find the best matching indicator.
 * Used as a fast client-side fallback (AI is the real matcher).
 */
export function fuzzyMatchIndicator(query: string): LiveIndicator | undefined {
  const q = query.toLowerCase();
  // Exact id match
  const byId = LIVE_INDICATORS.find((i) => i.id.toLowerCase() === q);
  if (byId) return byId;
  // Name contains match
  const byName = LIVE_INDICATORS.find(
    (i) => i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase())
  );
  return byName;
}
