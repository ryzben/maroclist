import { describe, expect, it } from "vitest";
import { localeSwitchHref } from "./localeSwitch";

describe("localeSwitchHref", () => {
  it("keeps the path and the full query string", () => {
    expect(localeSwitchHref("/listings", "?city=agadir", "ar")).toBe("/listings?city=agadir");
    expect(
      localeSwitchHref("/listings", "city=rabat&price_min=500000&price_max=900000&property_type=villa&bedrooms=3&sort=price_asc&page=2", "fr"),
    ).toBe("/listings?city=rabat&price_min=500000&price_max=900000&property_type=villa&bedrooms=3&sort=price_asc&page=2");
  });

  it("keeps next= (and its encoding) on the login page", () => {
    expect(localeSwitchHref("/login", "?next=%2Fpost", "en")).toBe("/login?next=%2Fpost");
    expect(
      localeSwitchHref("/login", "next=%2Flistings%2Fabc&action=save&listing=abc", "ar"),
    ).toBe("/login?next=%2Flistings%2Fabc&action=save&listing=abc");
  });

  it("returns the bare path when there is no query", () => {
    expect(localeSwitchHref("/post", "", "ar")).toBe("/post");
    expect(localeSwitchHref("/", "?", "en")).toBe("/");
    expect(localeSwitchHref("", "", "en")).toBe("/");
  });

  it("translates per-locale city page slugs", () => {
    expect(localeSwitchHref("/acheter/casablanca", "", "en")).toBe("/buy/casablanca");
    expect(localeSwitchHref("/buy/casablanca", "?page=2", "fr")).toBe("/acheter/casablanca?page=2");
    expect(localeSwitchHref("/louer/rabat", "", "ar")).toBe("/rent/rabat");
  });

  it("leaves other two-segment paths alone", () => {
    expect(localeSwitchHref("/listings/abc", "", "fr")).toBe("/listings/abc");
    expect(localeSwitchHref("/profile/u1", "", "ar")).toBe("/profile/u1");
  });
});
