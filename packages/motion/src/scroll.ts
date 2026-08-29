/* ============================================================================
   SMOOTH SCROLL. LENIS DRIVING GSAP.

   Lenis owns scroll position. This is the single most expensive thing to
   forget on this codebase, so it is restated here at the source:

     window.scrollTo() and Element.scrollIntoView() DO NOT MOVE LENIS.

   Jumping that way renders the page mid transition, everything washes out,
   and a pinned panel sits stuck over the viewport. That is not a defect and
   must not be "fixed". The correct handle is scrollTo() below, which routes
   through Lenis when Lenis is running and falls back to native when it is
   not. Same rule in page code and in any test harness.
   ========================================================================= */

import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion, onReducedMotionChange } from "./index";

type LenisOptions = ConstructorParameters<typeof Lenis>[0];

let lenis: Lenis | null = null;
let rafHandler: ((time: number) => void) | null = null;
let unwatchReducedMotion: (() => void) | null = null;
let lastOptions: LenisOptions = {};

declare global {
  interface Window {
    /** Exposed for tooling parity with the old build. Null under reduced motion. */
    __lenis?: Lenis | null;
  }
}

/** Creates the instance and wires it to the ticker. Assumes motion is allowed. */
function startLenis(): Lenis | null {
  if (lenis) return lenis;

  lenis = new Lenis({
    autoRaf: false, // GSAP's ticker drives it. Two raf loops fight each other.
    ...lastOptions,
  });

  // ScrollTrigger must recompute against Lenis position, not native scroll.
  lenis.on("scroll", ScrollTrigger.update);

  // One clock. Lenis takes ms, the GSAP ticker hands out seconds.
  rafHandler = (time: number) => {
    lenis?.raf(time * 1000);
  };
  gsap.ticker.add(rafHandler);

  // Lag smoothing invents time after a stall, which desyncs a scrubbed
  // timeline from actual scroll position. Off for scroll driven work.
  gsap.ticker.lagSmoothing(0);

  window.__lenis = lenis;
  return lenis;
}

/** Destroys the instance but leaves the preference watcher in place. */
function stopLenis(): void {
  if (rafHandler) {
    gsap.ticker.remove(rafHandler);
    rafHandler = null;
  }
  lenis?.destroy();
  lenis = null;
  if (typeof window !== "undefined") window.__lenis = null;
}

/**
 * Starts Lenis and wires it to the GSAP ticker.
 *
 * Under prefers-reduced-motion Lenis is NOT started. Smooth scroll is itself
 * animation: it decouples the viewport from the input device and is a
 * documented trigger for vestibular symptoms. ScrollTrigger works perfectly
 * well against native scroll, so nothing is lost but the smoothing.
 *
 * LIVE FLIP. The preference is watched, not read once. Reading once meant a
 * visitor who turned reduced motion OFF with the page open never got smooth
 * scroll back until a reload, and one who turned it ON kept being smooth
 * scrolled while every tween around them had correctly reverted. Toggling now
 * starts or destroys the instance in place, and refreshes ScrollTrigger
 * afterwards because pin measurements are taken against whichever scroller is
 * live. This mirrors what gsap.matchMedia does for tweens.
 *
 * Idempotent. Calling twice returns the existing instance rather than
 * stacking a second raf loop, which is what happens on a hot reload.
 */
export function initSmoothScroll(options: LenisOptions = {}): Lenis | null {
  if (typeof window === "undefined") return null;

  lastOptions = options;

  if (!unwatchReducedMotion) {
    unwatchReducedMotion = onReducedMotionChange((reduced) => {
      if (reduced) {
        stopLenis();
      } else {
        startLenis();
      }
      ScrollTrigger.refresh();
    });
  }

  if (prefersReducedMotion()) {
    window.__lenis = null;
    return null;
  }

  return startLenis();
}

/** Tears the instance down. Needed on astro:before-swap if view transitions land. */
export function destroySmoothScroll(): void {
  stopLenis();
  unwatchReducedMotion?.();
  unwatchReducedMotion = null;
}

export function getLenis(): Lenis | null {
  return lenis;
}

/**
 * The ONLY sanctioned way to move scroll position in this codebase.
 * Routes through Lenis when it is running, native when it is not.
 */
export function scrollTo(
  target: string | number | HTMLElement,
  options: { immediate?: boolean; offset?: number } = {},
): void {
  if (typeof window === "undefined") return;

  if (lenis) {
    lenis.scrollTo(target, { immediate: options.immediate ?? false, offset: options.offset ?? 0 });
    return;
  }

  // Reduced motion, or Lenis not started. Native, and never smooth: the
  // reduced-motion block in tokens.css forces scroll-behavior: auto anyway.
  const behavior: ScrollBehavior = "auto";
  if (typeof target === "number") {
    window.scrollTo({ top: target + (options.offset ?? 0), behavior });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY + (options.offset ?? 0);
  window.scrollTo({ top, behavior });
}


/* ============================================================================
   REFRESH AFTER THE PAGE STOPS MOVING UNDER ITS OWN WEIGHT.

   A pin measures the trigger's height once, at creation. Measure it before the
   webfont swaps in and every measurement below the fold is wrong, and the
   symptom is not an error: the pin releases early, or the scrub finishes with
   scroll left over. Same for an image that arrives without intrinsic
   dimensions.

   TWO FACES ARE IN PLAY NOW, roman and italic, and that broke the naive
   version of this. document.fonts.ready resolves when the fonts pending AT
   THAT MOMENT have settled. Italic is only requested once something italic is
   actually laid out, which can be after roman has landed and after ready has
   already resolved. So `if (fonts.status === "loaded") refresh()` on a page
   whose italic had not been requested yet refreshed against roman metrics and
   never looked again.

   The fix is to listen to `loadingdone`, which fires once per batch, for the
   life of the page. Cheap, and it covers a third face if one is ever added.
   ========================================================================= */

let settleWired = false;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Coalesces a burst of refresh requests into one.
 *
 * setTimeout, NOT requestAnimationFrame, and the reason generalises. rAF does
 * not run at all in a background tab. A refresh queued on rAF while the tab is
 * hidden would sit unqueued until the tab came forward, which is the same
 * failure class as the frozen entrance tween. Timers are throttled in a
 * background tab but they do run.
 */
function queueRefresh(): void {
  if (refreshTimer !== null) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    ScrollTrigger.refresh();
  }, 0);
}

/**
 * Refreshes every ScrollTrigger once fonts and images have settled, and again
 * whenever a late one lands. Idempotent, so it is safe to call from more than
 * one island on the same page.
 *
 * Call it once, after the scene has been defined.
 */
export function refreshOnSettle(): void {
  if (typeof window === "undefined") return;
  if (settleWired) {
    queueRefresh();
    return;
  }
  settleWired = true;

  // FONTS. loadingdone fires per batch and keeps firing, which is what covers
  // italic arriving after roman. fonts.ready handles the case where everything
  // had already settled before this ran and no further event is coming.
  const fonts = document.fonts;
  if (fonts) {
    fonts.addEventListener("loadingdone", queueRefresh);
    void fonts.ready.then(queueRefresh);
  }

  // DOCUMENT. window load covers every image present at parse time.
  if (document.readyState === "complete") {
    queueRefresh();
  } else {
    window.addEventListener("load", queueRefresh, { once: true });
  }

  // LATE IMAGES. A loading="lazy" image decodes when it nears the viewport,
  // long after load fired, and it changes layout height when it does. Only
  // images not already complete get a listener, so this costs nothing on a
  // page whose images are inline SVG.
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete) return;
    img.addEventListener("load", queueRefresh, { once: true });
    img.addEventListener("error", queueRefresh, { once: true });
  });
}
