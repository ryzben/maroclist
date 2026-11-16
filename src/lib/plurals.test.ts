import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import ar from "../../messages/ar.json";

const MESSAGES = { en, fr, ar } as const;
type L = keyof typeof MESSAGES;
// next-intl only logs bad messages by default; make them fail the test instead
const tr = (locale: L) =>
  createTranslator({ locale, messages: MESSAGES[locale], onError: (e) => { throw e; } });

describe("plural messages (ICU / Intl.PluralRules)", () => {
  it("uses the singular for 1 in English and French", () => {
    expect(tr("en")("filter.results", { count: 1 })).toBe("1 listing");
    expect(tr("en")("filter.results", { count: 9 })).toBe("9 listings");
    expect(tr("fr")("filter.results", { count: 1 })).toBe("1 annonce");
    // French treats 0 as singular
    expect(tr("fr")("filter.results", { count: 0 })).toBe("0 annonce");
    expect(tr("fr")("filter.results", { count: 2 })).toBe("2 annonces");
  });

  it("uses all Arabic plural forms", () => {
    const t = tr("ar");
    expect(t("filter.results", { count: 0 })).toBe("لا توجد إعلانات");
    expect(t("filter.results", { count: 1 })).toBe("إعلان واحد");
    expect(t("filter.results", { count: 2 })).toBe("إعلانان");
    expect(t("filter.results", { count: 3 })).toMatch(/إعلانات$/);
    expect(t("filter.results", { count: 11 })).toMatch(/إعلانًا$/);
    expect(t("filter.results", { count: 100 })).toMatch(/إعلان$/);
  });

  // Every message that takes {count} must format for each plural category without throwing
  it.each(["en", "fr", "ar"] as const)("all count messages format in %s", (locale) => {
    const t = tr(locale);
    const keys: string[] = [];
    const walk = (o: Record<string, unknown>, prefix: string) => {
      for (const [k, v] of Object.entries(o)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "string" && v.includes("{count")) keys.push(key);
        else if (v && typeof v === "object") walk(v as Record<string, unknown>, key);
      }
    };
    walk(MESSAGES[locale], "");
    expect(keys.length).toBeGreaterThan(5);
    for (const key of keys) {
      for (const count of [0, 1, 2, 3, 11, 100, 101]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => (t as any)(key, { count })).not.toThrow();
      }
    }
  });
});
