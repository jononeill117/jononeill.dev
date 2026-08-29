/* ============================================================================
   MOTION TOKEN BRIDGE

   Reads durations, scrub values and GSAP ease STRINGS out of the CSS custom
   properties defined in packages/tokens/tokens.css.

   WHY THIS EXISTS. If a GSAP tween hardcodes 0.24 and a CSS transition on the
   same element reads var(--dur-base), the two can disagree the moment the
   token changes. Worse, the reduced-motion block in tokens.css collapses every
   duration to 1ms; a hardcoded JS number would ignore that entirely and the
   CSS half of the animation would stop while the JS half kept playing.
   Reading through getComputedStyle means there is exactly one number.

   GSAP cannot consume a cubic-bezier() string, which is why the token file
   carries --gsap-ease-* alongside --ease-*. They are matched by feel, not
   byte-identical, and that is deliberate.

   BOTH SIDES ARE READ HERE. The --gsap-ease-* strings go to GSAP. The raw
   --ease-* beziers are exposed as `cssEase` for the case where JS has to
   write a CSS transition or a Web Animations easing on an element that a
   tween also touches. Without that half, a script setting
   `el.style.transition = "transform 240ms ease-out"` reintroduces exactly the
   disagreement this file exists to prevent, one layer down.
   ========================================================================= */

/** Duration values are handed to GSAP, which works in SECONDS, not ms. */
export interface MotionTokens {
  /** UI family. Snappy, short, may overshoot. A-D3. */
  readonly ui: {
    readonly instant: number;
    readonly quick: number;
    readonly base: number;
    readonly slow: number;
    readonly ease: string;
    readonly easeInOut: string;
    readonly easeSpring: string;
    readonly easeSnap: string;
  };
  /** CINE family. Long, eased, scrubbed. A-D3 explicitly does NOT apply. */
  readonly cine: {
    readonly beat: number;
    readonly phase: number;
    readonly ease: string;
    readonly scrubTight: number;
    readonly scrubLoose: number;
  };
  readonly stagger: {
    readonly tight: number;
    readonly base: number;
    readonly loose: number;
  };
  /**
   * The raw --ease-* cubic-bezier() strings, verbatim. For CSS transitions and
   * Web Animations only. GSAP cannot parse these; hand it `ui.ease` instead.
   */
  readonly cssEase: {
    readonly out: string;
    readonly inOut: string;
    readonly spring: string;
    readonly snap: string;
    readonly cine: string;
  };
}

/** Duration keys of the UI family. Excludes the ease keys, which are strings. */
export type UiSpeed = "instant" | "quick" | "base" | "slow";
/** Ease keys of the UI family, as GSAP strings. `spring` is the one that overshoots. */
export type UiFeel = "out" | "inOut" | "spring" | "snap";
/** Duration keys of the CINE family. */
export type CineBeat = "beat" | "phase";

/**
 * Parses a CSS time value into seconds. Accepts `240ms`, `0.9s` and a bare
 * number (treated as seconds). Returns `fallback` for anything unreadable
 * rather than throwing, because a missing token must not take a page down.
 */
export function parseSeconds(raw: string | null | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = raw.trim();
  if (value.endsWith("ms")) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n / 1000 : fallback;
  }
  if (value.endsWith("s")) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * The --gsap-ease-* tokens are authored as quoted CSS strings, so
 * getComputedStyle hands back `"power3.out"` with the quote characters
 * attached. Passing that straight to GSAP silently falls back to the default
 * ease, which is the kind of bug that reads as "the easing tokens do nothing".
 */
export function parseEase(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  const value = raw.trim().replace(/^["']|["']$/g, "").trim();
  return value.length > 0 ? value : fallback;
}

function parseNumber(raw: string | null | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseFloat(raw.trim());
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalises a raw custom property. tokens.css aligns its values in columns
 * for readability, so getComputedStyle hands back the internal runs of spaces
 * verbatim: `cubic-bezier(0.22, 1,    0.36, 1)`. Valid CSS, but it compares
 * unequal against the same value written normally, which turns any later
 * "does the tween agree with the transition" check into a false negative.
 */
function parseRaw(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  const value = raw.trim().replace(/\s+/g, " ");
  return value.length > 0 ? value : fallback;
}

/**
 * Reads the motion tokens off an element, defaulting to documentElement.
 *
 * Pass a scoped element when a section overrides a token locally. Values are
 * read at call time, not cached at module load, so a token that changes with
 * a media query is picked up on the next read. gsap.matchMedia re-runs its
 * callback when the query flips, which is where the re-read happens.
 */
export function readMotionTokens(scope?: Element | null): MotionTokens {
  if (typeof window === "undefined") return FALLBACK_TOKENS;

  const el = scope ?? document.documentElement;
  const cs = getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(name);

  return {
    ui: {
      instant: parseSeconds(v("--dur-instant"), FALLBACK_TOKENS.ui.instant),
      quick: parseSeconds(v("--dur-quick"), FALLBACK_TOKENS.ui.quick),
      base: parseSeconds(v("--dur-base"), FALLBACK_TOKENS.ui.base),
      slow: parseSeconds(v("--dur-slow"), FALLBACK_TOKENS.ui.slow),
      ease: parseEase(v("--gsap-ease-out"), FALLBACK_TOKENS.ui.ease),
      easeInOut: parseEase(v("--gsap-ease-in-out"), FALLBACK_TOKENS.ui.easeInOut),
      easeSpring: parseEase(v("--gsap-ease-spring"), FALLBACK_TOKENS.ui.easeSpring),
      easeSnap: parseEase(v("--gsap-ease-snap"), FALLBACK_TOKENS.ui.easeSnap),
    },
    cine: {
      beat: parseSeconds(v("--dur-cine-beat"), FALLBACK_TOKENS.cine.beat),
      phase: parseSeconds(v("--dur-cine-phase"), FALLBACK_TOKENS.cine.phase),
      ease: parseEase(v("--gsap-ease-cine"), FALLBACK_TOKENS.cine.ease),
      scrubTight: parseNumber(v("--scrub-tight"), FALLBACK_TOKENS.cine.scrubTight),
      scrubLoose: parseNumber(v("--scrub-loose"), FALLBACK_TOKENS.cine.scrubLoose),
    },
    stagger: {
      tight: parseSeconds(v("--stagger-tight"), FALLBACK_TOKENS.stagger.tight),
      base: parseSeconds(v("--stagger-base"), FALLBACK_TOKENS.stagger.base),
      loose: parseSeconds(v("--stagger-loose"), FALLBACK_TOKENS.stagger.loose),
    },
    cssEase: {
      out: parseRaw(v("--ease-out"), FALLBACK_TOKENS.cssEase.out),
      inOut: parseRaw(v("--ease-in-out"), FALLBACK_TOKENS.cssEase.inOut),
      spring: parseRaw(v("--ease-spring"), FALLBACK_TOKENS.cssEase.spring),
      snap: parseRaw(v("--ease-snap"), FALLBACK_TOKENS.cssEase.snap),
      cine: parseRaw(v("--ease-cine"), FALLBACK_TOKENS.cssEase.cine),
    },
  };
}

/**
 * Mirrors tokens.css. These are a crash guard for the case where the
 * stylesheet has not applied yet, NOT a second source of truth. If a value
 * here disagrees with the token file, the token file is right and this is a
 * bug. Nothing should ever be added here that does not exist there.
 */
const FALLBACK_TOKENS: MotionTokens = {
  ui: {
    instant: 0.09,
    quick: 0.16,
    base: 0.24,
    slow: 0.38,
    ease: "power3.out",
    easeInOut: "power2.inOut",
    easeSpring: "back.out(1.7)",
    easeSnap: "expo.out",
  },
  cine: {
    beat: 0.9,
    phase: 1.6,
    ease: "power2.inOut",
    scrubTight: 0.4,
    scrubLoose: 0.9,
  },
  stagger: {
    tight: 0.04,
    base: 0.07,
    loose: 0.12,
  },
  cssEase: {
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    snap: "cubic-bezier(0.16, 1, 0.3, 1)",
    cine: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};
