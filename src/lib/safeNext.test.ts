import { describe, expect, it } from "vitest";
import { NEXT_MAX_LENGTH, safeNext, stripLocalePrefix } from "./safeNext";

describe("safeNext", () => {
  it("accepts internal paths and keeps their query", () => {
    expect(safeNext("/post")).toBe("/post");
    expect(safeNext("/listings/abc?action=save")).toBe("/listings/abc?action=save");
    expect(safeNext("/")).toBe("/");
  });

  it("strips a locale prefix so the current locale wins", () => {
    expect(safeNext("/fr/post")).toBe("/post");
    expect(safeNext("/ar/listings?city=agadir")).toBe("/listings?city=agadir");
    expect(safeNext("/en")).toBe("/");
    expect(safeNext("/fr?x=1")).toBe("/?x=1");
  });

  it("does not strip look-alike segments", () => {
    expect(safeNext("/french-villas")).toBe("/french-villas");
    expect(safeNext("/arabic")).toBe("/arabic");
  });

  it.each([
    [null],
    [""],
    ["post"],
    ["https://evil.com"],
    ["//evil.com"],
    ["/\\evil.com"],
    ["\\\\evil.com"],
    ["/%2F/evil.com"],
    ["%2F%2Fevil.com"],
    ["/%252F%252Fevil.com"],
    ["/%5Cevil.com"],
    ["/%5c%5cevil.com"],
    ["/\t/evil.com"],
    ["/\n/evil.com"],
    ["/%09/evil.com"],
    ["/%00"],
    ["/%E0%A4%A"], // malformed escape
    ["javascript:alert(1)"],
    ["/" + "a".repeat(NEXT_MAX_LENGTH)],
  ])("rejects %j", (input) => {
    expect(safeNext(input)).toBeNull();
  });

  it("accepts a path of exactly the maximum length", () => {
    const p = "/" + "a".repeat(NEXT_MAX_LENGTH - 1);
    expect(safeNext(p)).toBe(p);
  });
});

describe("stripLocalePrefix", () => {
  it("handles bare, nested, query and hash forms", () => {
    expect(stripLocalePrefix("/ar")).toBe("/");
    expect(stripLocalePrefix("/ar/post")).toBe("/post");
    expect(stripLocalePrefix("/en#top")).toBe("/#top");
    expect(stripLocalePrefix("/post")).toBe("/post");
  });
});
