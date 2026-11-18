// @vitest-environment jsdom
import { act, type AnchorHTMLAttributes } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/en.json";
import { CONSENT_COOKIE, readConsent } from "@/lib/consent";
import ConsentBanner from "./ConsentBanner";
import Footer from "./Footer";

// Locale-aware Link needs the Next router; a plain <a> is enough here
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...rest} />,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = messages.cookies;
let container: HTMLDivElement;
let root: Root;

function render() {
  act(() => {
    root.render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConsentBanner />
        <Footer />
      </NextIntlClientProvider>
    );
  });
}

const banner = () => [...container.querySelectorAll("section")].find((s) => s.textContent?.includes(t.title));
const button = (label: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);
const switchFor = (label: string) =>
  [...banner()!.querySelectorAll("label")]
    .find((l) => l.textContent?.includes(label))!
    .querySelector<HTMLInputElement>("input[type=checkbox]")!;
const click = (el: HTMLElement | undefined) => {
  expect(el).toBeDefined();
  act(() => el!.click());
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-TEST");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
  vi.unstubAllEnvs();
});

describe("footer Cookie settings link", () => {
  it("is in the footer and shows the banner on the first visit", () => {
    render();
    expect(banner()).toBeDefined();
    expect(button(t.settings)).toBeDefined();
  });

  it("reopens the banner after a choice, with the saved choices pre-selected", () => {
    document.cookie = `${CONSENT_COOKIE}=1.a1.m0; Path=/`; // analytics accepted, ads refused
    render();
    expect(banner()).toBeUndefined();

    click(button(t.settings));
    expect(banner()).toBeDefined();
    expect(switchFor(t.analytics).checked).toBe(true);
    expect(switchFor(t.ads).checked).toBe(false);
  });

  it("reflects a choice made earlier in the same visit, and saving a change updates the cookie", () => {
    render();
    click(button(t.refuse));
    expect(banner()).toBeUndefined();
    expect(readConsent()).toEqual({ analytics: false, ads: false });

    click(button(t.settings));
    expect(switchFor(t.analytics).checked).toBe(false);
    expect(switchFor(t.ads).checked).toBe(false);

    click(switchFor(t.ads));
    click(button(t.save));
    expect(banner()).toBeUndefined();
    expect(readConsent()).toEqual({ analytics: false, ads: true });

    click(button(t.settings));
    expect(switchFor(t.analytics).checked).toBe(false);
    expect(switchFor(t.ads).checked).toBe(true);
  });

  it("is hidden when no tracker needing consent is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "");
    render();
    expect(banner()).toBeUndefined();
    expect(button(t.settings)).toBeUndefined();
  });
});
