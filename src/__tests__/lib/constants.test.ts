import { describe, it, expect } from "vitest";
import {
  techRates,
  serviceLabels,
  IPHONE_MODELS,
  capacityLabels,
  targetLabels,
  targetRates,
  calcPurchaseCommission,
  calcDeviceSalesCommission,
  calcGeneralSalesCommission,
  calcAchievedLevel,
  calcProjection,
  getDaysElapsed,
} from "@/lib/constants";

describe("techRates", () => {
  it("has correct values for all service categories", () => {
    expect(techRates.MODULO_BATERIA_PIN_O_MAYOR_20K).toBe(1500);
    expect(techRates.REVISION_APROBADA).toBe(2000);
    expect(techRates.LIMPIEZA_O_MENOR_20K).toBe(650);
    expect(techRates.DENEGADA_SIN_REPARACION).toBe(0);
  });
});

describe("serviceLabels", () => {
  it("has a label for each service category", () => {
    const keys = Object.keys(techRates) as (keyof typeof techRates)[];
    for (const key of keys) {
      expect(serviceLabels[key]).toBeTruthy();
      expect(typeof serviceLabels[key]).toBe("string");
    }
  });
});

describe("IPHONE_MODELS", () => {
  it("starts with iPhone 12", () => {
    expect(IPHONE_MODELS[0]).toBe("iPhone 12");
  });

  it("ends with iPhone 17 Pro Max", () => {
    expect(IPHONE_MODELS[IPHONE_MODELS.length - 1]).toBe("iPhone 17 Pro Max");
  });

  it("does not contain Mini or SE models", () => {
    const joined = IPHONE_MODELS.join(" ");
    expect(joined).not.toContain("Mini");
    expect(joined).not.toContain("SE");
    expect(joined).not.toContain("16e");
    expect(joined).not.toContain("17e");
  });

  it("has at least 20 models", () => {
    expect(IPHONE_MODELS.length).toBeGreaterThanOrEqual(20);
  });
});

describe("capacityLabels", () => {
  it("maps all capacity keys to labels", () => {
    expect(capacityLabels.GB_128).toBe("128 GB");
    expect(capacityLabels.GB_256).toBe("256 GB");
    expect(capacityLabels.GB_512).toBe("512 GB");
    expect(capacityLabels.TB_1).toBe("1 TB");
    expect(capacityLabels.TB_2).toBe("2 TB");
  });

  it("has exactly 5 capacity options", () => {
    expect(Object.keys(capacityLabels)).toHaveLength(5);
  });
});

describe("targetLabels and targetRates", () => {
  it("has labels for all 4 target levels", () => {
    expect(targetLabels.LESS_THAN_100).toBe("< 100%");
    expect(targetLabels.EXACTLY_100).toBe("100%");
    expect(targetLabels.EXACTLY_110).toBe("110%");
    expect(targetLabels.GREATER_EQUAL_125).toBe("≥ 125%");
  });

  it("has rates for all 4 target levels", () => {
    expect(targetRates.LESS_THAN_100).toBeCloseTo(0.01);
    expect(targetRates.EXACTLY_100).toBeCloseTo(0.014);
    expect(targetRates.EXACTLY_110).toBeCloseTo(0.016);
    expect(targetRates.GREATER_EQUAL_125).toBeCloseTo(0.018);
  });

  it("rates are in ascending order", () => {
    expect(targetRates.LESS_THAN_100).toBeLessThan(targetRates.EXACTLY_100);
    expect(targetRates.EXACTLY_100).toBeLessThan(targetRates.EXACTLY_110);
    expect(targetRates.EXACTLY_110).toBeLessThan(targetRates.GREATER_EQUAL_125);
  });
});

describe("calcPurchaseCommission", () => {
  it("returns 0 for 0 purchases", () => {
    expect(calcPurchaseCommission(0)).toEqual({ perUnit: 0, total: 0 });
  });

  it("returns $5800/unit for 1 purchase", () => {
    expect(calcPurchaseCommission(1)).toEqual({ perUnit: 5800, total: 5800 });
  });

  it("returns $6400/unit for 2 purchases", () => {
    expect(calcPurchaseCommission(2)).toEqual({ perUnit: 6400, total: 12800 });
  });

  it("returns $6900/unit for 3 purchases", () => {
    expect(calcPurchaseCommission(3)).toEqual({ perUnit: 6900, total: 20700 });
  });

  it("returns $7300/unit for 4 purchases", () => {
    expect(calcPurchaseCommission(4)).toEqual({ perUnit: 7300, total: 29200 });
  });

  it("returns $7300/unit for 5 purchases", () => {
    expect(calcPurchaseCommission(5)).toEqual({ perUnit: 7300, total: 36500 });
  });

  it("returns $7300/unit for 10 purchases", () => {
    expect(calcPurchaseCommission(10)).toEqual({ perUnit: 7300, total: 73000 });
  });

  it("returns $7300/unit for large quantities", () => {
    expect(calcPurchaseCommission(100)).toEqual({ perUnit: 7300, total: 730000 });
  });

  it("handles negative count gracefully", () => {
    const result = calcPurchaseCommission(-1);
    expect(result.perUnit).toBe(7300);
    expect(result.total).toBe(-7300);
  });
});

describe("calcDeviceSalesCommission", () => {
  it("returns 0 when quantity is 0", () => {
    expect(calcDeviceSalesCommission(0, 100000)).toBe(0);
  });

  it("returns 0 when volume is 0", () => {
    expect(calcDeviceSalesCommission(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(calcDeviceSalesCommission(0, 0)).toBe(0);
  });

  it("applies 0.5% rate for 1-3 quantities", () => {
    expect(calcDeviceSalesCommission(1, 100000)).toBeCloseTo(500);
    expect(calcDeviceSalesCommission(2, 100000)).toBeCloseTo(500);
    expect(calcDeviceSalesCommission(3, 100000)).toBeCloseTo(500);
  });

  it("applies 0.8% rate for 4 quantities", () => {
    expect(calcDeviceSalesCommission(4, 100000)).toBeCloseTo(800);
  });

  it("applies 1.0% rate for 5-9 quantities", () => {
    expect(calcDeviceSalesCommission(5, 100000)).toBeCloseTo(1000);
    expect(calcDeviceSalesCommission(7, 100000)).toBeCloseTo(1000);
    expect(calcDeviceSalesCommission(9, 100000)).toBeCloseTo(1000);
  });

  it("applies 1.6% rate for 10+ quantities", () => {
    expect(calcDeviceSalesCommission(10, 100000)).toBeCloseTo(1600);
    expect(calcDeviceSalesCommission(20, 100000)).toBeCloseTo(1600);
  });

  it("calculates correctly with fractional volume", () => {
    expect(calcDeviceSalesCommission(1, 50000.5)).toBeCloseTo(250.0025);
  });

  it("handles negative values", () => {
    expect(calcDeviceSalesCommission(-1, 100000)).toBeCloseTo(1600);
    expect(calcDeviceSalesCommission(1, -100000)).toBeCloseTo(-500);
  });
});

describe("calcGeneralSalesCommission", () => {
  it("calculates base and commission correctly for LESS_THAN_100", () => {
    const result = calcGeneralSalesCommission(500000, 100000, "LESS_THAN_100");
    expect(result.base).toBe(400000);
    expect(result.commission).toBeCloseTo(4000);
  });

  it("calculates base and commission correctly for EXACTLY_100", () => {
    const result = calcGeneralSalesCommission(500000, 100000, "EXACTLY_100");
    expect(result.base).toBe(400000);
    expect(result.commission).toBeCloseTo(5600);
  });

  it("calculates base and commission correctly for EXACTLY_110", () => {
    const result = calcGeneralSalesCommission(500000, 100000, "EXACTLY_110");
    expect(result.base).toBe(400000);
    expect(result.commission).toBeCloseTo(6400);
  });

  it("calculates base and commission correctly for GREATER_EQUAL_125", () => {
    const result = calcGeneralSalesCommission(500000, 100000, "GREATER_EQUAL_125");
    expect(result.base).toBe(400000);
    expect(result.commission).toBeCloseTo(7200);
  });

  it("returns base 0 when grossVolume equals deviceVolume", () => {
    const result = calcGeneralSalesCommission(100000, 100000, "EXACTLY_100");
    expect(result.base).toBe(0);
    expect(result.commission).toBe(0);
  });

  it("returns base 0 when grossVolume is less than deviceVolume", () => {
    const result = calcGeneralSalesCommission(50000, 100000, "EXACTLY_100");
    expect(result.base).toBe(0);
    expect(result.commission).toBe(0);
  });

  it("returns 0 for zero inputs", () => {
    const result = calcGeneralSalesCommission(0, 0, "EXACTLY_100");
    expect(result.base).toBe(0);
    expect(result.commission).toBe(0);
  });

  it("handles all 4 targets with same volume", () => {
    const gross = 1000000;
    const device = 200000;
    const base = 800000;

    const r1 = calcGeneralSalesCommission(gross, device, "LESS_THAN_100");
    const r2 = calcGeneralSalesCommission(gross, device, "EXACTLY_100");
    const r3 = calcGeneralSalesCommission(gross, device, "EXACTLY_110");
    const r4 = calcGeneralSalesCommission(gross, device, "GREATER_EQUAL_125");

    expect(r1.base).toBe(base);
    expect(r2.base).toBe(base);
    expect(r3.base).toBe(base);
    expect(r4.base).toBe(base);

    expect(r1.commission).toBeCloseTo(base * 0.01);
    expect(r2.commission).toBeCloseTo(base * 0.014);
    expect(r3.commission).toBeCloseTo(base * 0.016);
    expect(r4.commission).toBeCloseTo(base * 0.018);
  });
});

describe("calcAchievedLevel", () => {
  const goals = { minimum: 100, target: 150, veryGood: 200 };

  it("returns BELOW_MINIMUM when units are under the minimum", () => {
    expect(calcAchievedLevel(99, goals)).toBe("BELOW_MINIMUM");
  });

  it("returns MINIMUM when units equal the minimum exactly", () => {
    expect(calcAchievedLevel(100, goals)).toBe("MINIMUM");
  });

  it("returns TARGET when units equal the target exactly", () => {
    expect(calcAchievedLevel(150, goals)).toBe("TARGET");
  });

  it("returns VERY_GOOD when units equal the very good goal exactly", () => {
    expect(calcAchievedLevel(200, goals)).toBe("VERY_GOOD");
  });

  it("returns the lower level when units fall between two goals", () => {
    expect(calcAchievedLevel(149, goals)).toBe("MINIMUM");
    expect(calcAchievedLevel(199, goals)).toBe("TARGET");
  });

  it.each([
    ["units", null, goals],
    ["minimum", 120, { ...goals, minimum: null }],
    ["target", 120, { ...goals, target: null }],
    ["veryGood", 120, { ...goals, veryGood: null }],
  ])("returns null when %s is missing", (_name, units, g) => {
    expect(calcAchievedLevel(units, g)).toBeNull();
  });
});

describe("calcProjection", () => {
  it("projects units sold over the whole month from the days elapsed", () => {
    expect(calcProjection(120, 10, 30)).toBe(360);
  });

  it("rounds the projection to the nearest whole unit", () => {
    expect(calcProjection(120, 13, 30)).toBe(277); // 276.92...
    expect(calcProjection(100, 7, 30)).toBe(429); // 428.57...
  });

  it("returns null when units are missing or no days have elapsed", () => {
    expect(calcProjection(null, 10, 30)).toBeNull();
    expect(calcProjection(120, 0, 30)).toBeNull();
  });
});

describe("getDaysElapsed", () => {
  it("returns today's day and the month length for the current month", () => {
    const today = new Date(2026, 10, 13); // 13 nov 2026
    expect(getDaysElapsed(11, 2026, today)).toEqual({ elapsed: 13, daysInMonth: 30 });
  });

  it("returns the whole month for a past month", () => {
    const today = new Date(2026, 10, 13);
    expect(getDaysElapsed(10, 2026, today)).toEqual({ elapsed: 31, daysInMonth: 31 }); // oct 2026
    expect(getDaysElapsed(12, 2025, today)).toEqual({ elapsed: 31, daysInMonth: 31 }); // previous year
    expect(getDaysElapsed(2, 2024, today)).toEqual({ elapsed: 29, daysInMonth: 29 }); // leap year
  });

  it("returns 0 elapsed days for a future month", () => {
    const today = new Date(2026, 10, 13);
    expect(getDaysElapsed(12, 2026, today)).toEqual({ elapsed: 0, daysInMonth: 31 }); // next month
    expect(getDaysElapsed(1, 2027, today)).toEqual({ elapsed: 0, daysInMonth: 31 }); // next year
  });
});
