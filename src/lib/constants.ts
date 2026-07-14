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
