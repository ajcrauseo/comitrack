export type ServiceCategory =
  | "MODULO_BATERIA_PIN_O_MAYOR_20K"
  | "REVISION_APROBADA"
  | "LIMPIEZA_O_MENOR_20K"
  | "DENEGADA_SIN_REPARACION";

export const techRates: Record<ServiceCategory, number> = {
  MODULO_BATERIA_PIN_O_MAYOR_20K: 1500,
  REVISION_APROBADA: 2000,
  LIMPIEZA_O_MENOR_20K: 650,
  DENEGADA_SIN_REPARACION: 0,
};

export const serviceLabels: Record<ServiceCategory, string> = {
  MODULO_BATERIA_PIN_O_MAYOR_20K: "Módulo, Batería, Pin o >20k",
  REVISION_APROBADA: "Revisión Aprobada",
  LIMPIEZA_O_MENOR_20K: "Limpieza o <20k",
  DENEGADA_SIN_REPARACION: "Denegada / Sin Reparación",
};

// ─── Compras de Equipos ────────────────────────────────────────────────────────

export const IPHONE_MODELS = [
  "iPhone 12",
  "iPhone 12 Pro",
  "iPhone 12 Pro Max",
  "iPhone 13",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14",
  "iPhone 14 Plus",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 17",
  "iPhone 17 Pro",
  "iPhone 17 Pro Max",
] as const;

export type CapacityKey = "GB_128" | "GB_256" | "GB_512" | "TB_1" | "TB_2";

export const capacityLabels: Record<CapacityKey, string> = {
  GB_128: "128 GB",
  GB_256: "256 GB",
  GB_512: "512 GB",
  TB_1: "1 TB",
  TB_2: "2 TB",
};

/** Comisión escalonada por cantidad total de compras en el mes */
export function calcPurchaseCommission(count: number): {
  perUnit: number;
  total: number;
} {
  if (count === 0) return { perUnit: 0, total: 0 };
  if (count === 1) return { perUnit: 5800, total: 5800 };
  if (count === 2) return { perUnit: 6400, total: 12800 };
  if (count === 3) return { perUnit: 6900, total: 20700 };
  return { perUnit: 7300, total: 7300 * count };
}

// ─── Ventas de Equipos ────────────────────────────────────────────────────────

/** Comisión por cantidad × volumen de ventas de equipos */
export function calcDeviceSalesCommission(
  quantity: number,
  volume: number
): number {
  if (quantity === 0 || volume === 0) return 0;
  let rate = 0;
  if (quantity >= 1 && quantity <= 3) rate = 0.005;
  else if (quantity === 4) rate = 0.008;
  else if (quantity >= 5 && quantity <= 9) rate = 0.01;
  else rate = 0.016;
  return volume * rate;
}

export const deviceSalesRateLabels: { qty: string; rate: string }[] = [
  { qty: "1–3 equipos", rate: "0.5%" },
  { qty: "4 equipos", rate: "0.8%" },
  { qty: "5–9 equipos", rate: "1.0%" },
  { qty: "10+ equipos", rate: "1.6%" },
];

// ─── Ventas Generales ─────────────────────────────────────────────────────────

export type TargetKey =
  | "LESS_THAN_100"
  | "EXACTLY_100"
  | "EXACTLY_110"
  | "GREATER_EQUAL_125";

export const targetLabels: Record<TargetKey, string> = {
  LESS_THAN_100: "< 100%",
  EXACTLY_100: "100%",
  EXACTLY_110: "110%",
  GREATER_EQUAL_125: "≥ 125%",
};

export const targetRates: Record<TargetKey, number> = {
  LESS_THAN_100: 0.01,
  EXACTLY_100: 0.014,
  EXACTLY_110: 0.016,
  GREATER_EQUAL_125: 0.018,
};

/** Comisión de ventas generales: (bruto - volumen equipos) × tasa objetivo */
export function calcGeneralSalesCommission(
  grossVolume: number,
  deviceVolume: number,
  target: TargetKey
): { base: number; commission: number } {
  const base = Math.max(0, grossVolume - deviceVolume);
  return { base, commission: base * targetRates[target] };
}

export type AchievedLevel = "BELOW_MINIMUM" | "MINIMUM" | "TARGET" | "VERY_GOOD";

export function calcAchievedLevel(
  units: number | null,
  goals: { minimum: number | null; target: number | null; veryGood: number | null }
): AchievedLevel | null {
  if (
    units === null ||
    goals.minimum === null ||
    goals.target === null ||
    goals.veryGood === null
  ) {
    return null;
  }
  if (units >= goals.veryGood) return "VERY_GOOD";
  if (units >= goals.target) return "TARGET";
  if (units >= goals.minimum) return "MINIMUM";
  return "BELOW_MINIMUM";
}

/** Nivel alcanzado a partir del registro mensual de Ventas Generales (null si falta el registro o algún dato) */
export function calcAchievedLevelFromRecord(
  record: {
    unitsSold: number | null;
    unitsMinimum: number | null;
    unitsTarget: number | null;
    unitsVeryGood: number | null;
  } | null
): AchievedLevel | null {
  return calcAchievedLevel(record?.unitsSold ?? null, {
    minimum: record?.unitsMinimum ?? null,
    target: record?.unitsTarget ?? null,
    veryGood: record?.unitsVeryGood ?? null,
  });
}

export const levelLabels: Record<AchievedLevel, string> = {
  BELOW_MINIMUM: "Bajo el mínimo",
  MINIMUM: "Mínimo",
  TARGET: "Objetivo",
  VERY_GOOD: "Muy bueno",
};

/** true si los objetivos cargados cumplen mínimo ≤ objetivo ≤ muy bueno (los vacíos se ignoran) */
export function areGoalsInOrder(
  minimum: number | null | undefined,
  target: number | null | undefined,
  veryGood: number | null | undefined
): boolean {
  const loaded = [minimum, target, veryGood].filter((v): v is number => v != null);
  return loaded.every((v, i) => i === 0 || v >= loaded[i - 1]);
}

export function calcProjection(
  units: number | null,
  daysElapsed: number,
  daysInMonth: number
): number | null {
  if (units === null || daysElapsed <= 0) return null;
  return Math.round((units / daysElapsed) * daysInMonth);
}

export function getDaysElapsed(
  month: number,
  year: number,
  today: Date
): { elapsed: number; daysInMonth: number } {
  const daysInMonth = new Date(year, month, 0).getDate();
  const requested = year * 12 + month;
  const current = today.getFullYear() * 12 + today.getMonth() + 1;
  const elapsed =
    requested < current ? daysInMonth : requested > current ? 0 : today.getDate();
  return { elapsed, daysInMonth };
}

/** Monto de Módulo/Batería/Pin/>20k según el nivel alcanzado (desde nov/2026) */
const modulePinRatesByLevel: Record<AchievedLevel, number> = {
  BELOW_MINIMUM: 1500,
  MINIMUM: 1500,
  TARGET: 2500,
  VERY_GOOD: 3500,
};

/** true si en ese mes/año rige el nivel alcanzado (desde nov/2026) */
function levelApplies(month: number, year: number): boolean {
  return year * 12 + month >= 2026 * 12 + 11;
}

/** Monto de un servicio técnico según categoría, mes/año y nivel alcanzado */
export function calcTechServiceRate(
  category: ServiceCategory,
  month: number,
  year: number,
  level: AchievedLevel | null
): number {
  if (levelApplies(month, year) && level && category === "MODULO_BATERIA_PIN_O_MAYOR_20K") {
    return modulePinRatesByLevel[level];
  }
  return techRates[category];
}
