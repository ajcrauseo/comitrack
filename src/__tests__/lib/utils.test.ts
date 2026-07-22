import { describe, it, expect } from "vitest";
import { cn, formatARS } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toBe("base extra");
  });

  it("handles undefined and null", () => {
    const result = cn("base", undefined, null, "extra");
    expect(result).toBe("base extra");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("resolves tailwind-merge conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles complex tailwind class combinations", () => {
    expect(cn("block", "hidden")).toBe("hidden");
    expect(cn("flex", "block")).toBe("block");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty strings", () => {
    expect(cn("")).toBe("");
    expect(cn("a", "", "b")).toBe("a b");
  });
});

describe("formatARS", () => {
  it("formats zero", () => {
    const result = formatARS.format(0);
    expect(result).toContain("$");
    expect(result).toContain("0");
  });

  it("formats small amounts", () => {
    const result1500 = formatARS.format(1500);
    const result2000 = formatARS.format(2000);
    expect(result1500).toContain("$");
    expect(result1500).toContain("1.500");
    expect(result2000).toContain("$");
    expect(result2000).toContain("2.000");
  });

  it("formats large amounts", () => {
    const result500k = formatARS.format(500000);
    const result1M = formatARS.format(1000000);
    expect(result500k).toContain("$");
    expect(result500k).toContain("500.000");
    expect(result1M).toContain("$");
    expect(result1M).toContain("1.000.000");
  });

  it("formats with decimal cents", () => {
    const result = formatARS.format(1500.5);
    expect(result).toContain("$");
    expect(result).toContain("1.500");
  });

  it("formats negative numbers", () => {
    const result = formatARS.format(-5000);
    expect(result).toContain("$");
    expect(result).toContain("5.000");
  });

  it("formats typical commission amounts", () => {
    expect(formatARS.format(2500)).toContain("2.500");
    expect(formatARS.format(3500)).toContain("3.500");
    expect(formatARS.format(4500)).toContain("4.500");
    expect(formatARS.format(10500)).toContain("10.500");
  });

  it("uses es-AR locale conventions", () => {
    const result = formatARS.format(1234567);
    expect(result).toContain("$");
    expect(result).toContain(".");
  });
});
