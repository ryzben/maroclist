import { describe, expect, it } from "vitest";
import { isPriceRangeInvalid, parsePriceBound, priceFilterBounds } from "./priceRange";

describe("price range", () => {
  it("parses bounds", () => {
    expect(parsePriceBound("500000")).toBe(500000);
    expect(parsePriceBound("1 000 000")).toBe(1000000);
    expect(parsePriceBound("")).toBeUndefined();
    expect(parsePriceBound("abc")).toBeUndefined();
    expect(parsePriceBound("-5")).toBeUndefined();
    expect(parsePriceBound(0)).toBeUndefined();
  });

  it("flags min above max only", () => {
    expect(isPriceRangeInvalid("2000000", "500000")).toBe(true);
    expect(isPriceRangeInvalid("500000", "2000000")).toBe(false);
    expect(isPriceRangeInvalid("500000", "500000")).toBe(false);
    expect(isPriceRangeInvalid("2000000", "")).toBe(false);
    expect(isPriceRangeInvalid(undefined, "500000")).toBe(false);
  });

  it("drops both bounds server-side when inverted", () => {
    expect(priceFilterBounds("2000000", "500000")).toEqual({ invalid: true });
    expect(priceFilterBounds("100", "900")).toEqual({ min: 100, max: 900, invalid: false });
    expect(priceFilterBounds(undefined, undefined)).toEqual({ min: undefined, max: undefined, invalid: false });
  });
});
