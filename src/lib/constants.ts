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
  MODULO_BATERIA_PIN_O_MAYOR_20K: "Módulo, Batería, Pin o >20k ($1.500)",
  REVISION_APROBADA: "Revisión Aprobada ($2.000)",
  LIMPIEZA_O_MENOR_20K: "Limpieza o <20k ($650)",
  DENEGADA_SIN_REPARACION: "Denegada / Sin Reparación ($0)",
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
  if (count === 1) return { perUnit: 2000, total: 2000 };
  if (count === 2) return { perUnit: 2500, total: 5000 };
  if (count === 3) return { perUnit: 3500, total: 10500 };
  return { perUnit: 4500, total: 4500 * count };
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
