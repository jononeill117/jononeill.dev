/* ============================================================================
   MOTION. GSAP + ScrollTrigger, REDUCED MOTION FIRST.

   The reduced-motion wrapper is here from the first commit deliberately.
   Retrofitting it means auditing every tween already written, and the tween
   that gets missed is invisible until someone with the OS setting on lands on
   the page and finds an element stuck at opacity 0.

   TWO HALVES, BOTH REQUIRED. tokens.css handles CSS transitions and
   animations under prefers-reduced-motion. This file handles GSAP. Neither
   covers the other. A GSAP tween is a JS property write; no CSS media query
   can reach it.

   GSAP 3.13+ from the public npm package. Free for commercial use including
   ScrollTrigger since April 2025. No licence key, no Club membership, and the
   old private registry is dead. Do not add auth to install it.

   ---------------------------------------------------------------------------
   THE ONE RULE THAT OUTRANKS TASTE HERE.

   NEVER ANIMATE CONTENT IN FROM opacity: 0. If the tween stalls, the content
   is gone. requestAnimationFrame does not run at all in a background tab, and
   Phase 0 caught GSAP frozen mid entrance with rows sitting at 0 indefinitely.
   That is the same shape as the old [data-reveal] failure. Animate a
   TRANSFORM: a transform cannot hide content, so it cannot produce that class
   of bug. If a fade is genuinely wanted, start from a low NON ZERO opacity, or
   set the visible state in CSS and tween from the current value.

   Every documented example below obeys that rule, on purpose. An example is a
   teaching surface and a wrong one propagates.
   ========================================================================= */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { readMotionTokens, type MotionTokens, type UiSpeed, type UiFeel, type CineBeat } from "./tokens";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  // Mobile browsers fire a resize every time the URL bar collapses or expands.
  // Left alone, ScrollTrigger recalculates pins mid scroll and a pinned panel
  // visibly jumps. This tells it to ignore a resize that only changed the
  // viewport HEIGHT on a touch device, which is the URL bar and nothing else.
  // A real orientation change still refreshes, and so does any width change.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };
export {
  readMotionTokens,
  parseEase,
  parseSeconds,
  type MotionTokens,
  type UiSpeed,
  type UiFeel,
  type CineBeat,
} from "./tokens";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true; // SSR: assume the safe branch.
  return window.matchMedia(REDUCED_QUERY).matches;
}

/**
 * Fires whenever the reduced-motion preference flips, in either direction.
 * gsap.matchMedia already handles reverting tweens; this is for the things
 * GSAP does not own, chiefly starting and stopping Lenis. Returns an
 * unsubscribe function.
 */
export function onReducedMotionChange(handler: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(REDUCED_QUERY);
  const listener = (event: MediaQueryListEvent) => handler(event.matches);
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}

export interface MotionConditions {
  /** True when the visitor has expressed no preference. Animate freely. */
  readonly motionOk: boolean;
  /** True when the visitor asked for reduced motion. Set final state, do not tween. */
  readonly reduced: boolean;
}

export interface MotionApi {
  readonly conditions: MotionConditions;
  /** Scoped GSAP context. Anything created through it reverts on teardown. */
  readonly ctx: gsap.Context;
  /** Motion tokens, re-read each time the media query flips. */
  readonly tokens: MotionTokens;
  readonly gsap: typeof gsap;
  readonly ScrollTrigger: typeof ScrollTrigger;
}

/**
 * THE WRAPPER. Every tween and every ScrollTrigger in this codebase is created
 * inside a defineMotion callback. Nothing else.
 *
 * gsap.matchMedia() re-runs the callback when the media query flips and
 * REVERTS everything the previous run created, which is the property that
 * makes live toggling of the OS setting work. Creating a tween outside it
 * leaves an orphan that survives the flip.
 *
 * Both branches run: `motionOk` and `reduced`. The reduced branch is not
 * optional and is not "skip the animation". It must put elements in their
 * FINAL state. An element left at opacity 0 because its reveal never fired is
 * a content loss, not a tasteful degradation.
 *
 *   defineMotion(({ conditions, tokens, gsap }) => {
 *     if (conditions.reduced) {
 *       gsap.set(".reveal", { y: 0 });   // final state, transform only
 *       return;
 *     }
 *     gsap.from(".reveal", ui(tokens, { y: 24, stagger: tokens.stagger.tight }));
 *   });
 *
 * Return a function to run extra teardown of your own, for anything GSAP does
 * not own. matchMedia calls it before reverting the context.
 *
 * WHY `not (prefers-reduced-motion: reduce)` AND NOT `no-preference`.
 * Changed deliberately, and it is the one behavioural change to the Phase 0
 * skeleton. The two queries are not complements. A browser that does not
 * implement the feature at all matches NEITHER `reduce` nor `no-preference`,
 * so with the old pair neither branch ran, no tween was created and no final
 * state was set. Nothing was visibly broken today only because the smoke test
 * animated a transform. `not (...)` is the true complement, so exactly one
 * branch always runs and the final state is always reached.
 *
 * @param scope Optional element or selector limiting the GSAP context.
 * @returns The MatchMedia instance. Call .revert() to tear the whole thing down.
 */
export function defineMotion(
  build: (api: MotionApi) => void | (() => void),
  scope?: Element | string | null,
): gsap.MatchMedia | null {
  if (typeof window === "undefined") return null;

  const mm = scope ? gsap.matchMedia(scope) : gsap.matchMedia();

  mm.add(
    {
      motionOk: `not ${REDUCED_QUERY}`,
      reduced: REDUCED_QUERY,
    },
    (ctx) => {
      const conditions = ctx.conditions as unknown as MotionConditions;
      // Read tokens INSIDE the callback. tokens.css collapses every duration
      // to 1ms under reduced motion, so reading at module load would cache
      // the wrong set for whichever branch happened to run second.
      const tokens = readMotionTokens(typeof scope === "string" ? document.querySelector(scope) : scope);
      return build({ conditions, ctx, tokens, gsap, ScrollTrigger });
    },
  );

  return mm;
}


/* ============================================================================
   THE TWO MOTION FAMILIES.

   tokens.css splits motion in two and the split is load bearing. Pick the
   FAMILY before you pick the value. Using a UI duration on a cinematic ruins
   the pacing; using a CINE easing on a button makes the whole site feel slow.

     ui()    A-D3 APPLIES.        Short, snappy, spring permitted to overshoot.
                                  Self timed. The user did one thing and the
                                  interface answers. Buttons, tabs, accordions,
                                  hovers, nav, non pinned reveals.

     cine()  A-D3 DOES NOT APPLY. Long, eased, no overshoot. Usually SCRUBBED,
                                  which means the duration is a proportion of
                                  the timeline rather than a wall clock, and
                                  scroll position is the playhead. Pinned
                                  scenes, the climax.

   Both return TWEEN VARS, not a tween, so they compose with .to/.from/.fromTo
   and with a timeline. Anything you pass in overrides the token default, which
   is what an intentional exception is supposed to look like.
   ========================================================================= */

const UI_FEEL_KEY = {
  out: "ease",
  inOut: "easeInOut",
  spring: "easeSpring",
  snap: "easeSnap",
} as const satisfies Record<UiFeel, keyof MotionTokens["ui"]>;

export interface UiOptions {
  /** Which --dur-* token to use. Default "base", which is --dur-base. */
  readonly speed?: UiSpeed;
  /** Which --gsap-ease-* token to use. Default "out". "spring" is the one that overshoots. */
  readonly feel?: UiFeel;
}

/**
 * UI FAMILY. A-D3 APPLIES: snappy, short, spring, permitted to overshoot.
 *
 * For interface response, not for storytelling. Buttons, tabs, accordions,
 * hovers, nav, and reveals in NON PINNED sections. Never inside a pinned or
 * scrubbed layer: a reveal there depends on an observer that a pin can stop
 * from ever firing, which is exactly how the old [data-reveal] build lost
 * content permanently.
 *
 * Durations come from --dur-instant / --dur-quick / --dur-base / --dur-slow,
 * eases from --gsap-ease-out / --gsap-ease-in-out / --gsap-ease-spring /
 * --gsap-ease-snap. Under reduced motion tokens.css collapses every duration
 * to 1ms, so a ui() tween created in the `reduced` branch is effectively an
 * instant set. That is a safety net, not a licence to animate there.
 *
 *   // default, --dur-base with --gsap-ease-out
 *   gsap.from(rows, ui(tokens, { y: 12, stagger: tokens.stagger.tight }));
 *
 *   // the overshoot, explicitly asked for
 *   gsap.to(marker, ui(tokens, { scale: 1.2 }, { speed: "quick", feel: "spring" }));
 *
 *   // a bare string still selects the speed, feel stays default
 *   gsap.to(panel, ui(tokens, { yPercent: -100 }, "slow"));
 *
 * Note what the examples animate: y, scale, yPercent. TRANSFORMS. No example
 * here starts from opacity 0 and none ever will.
 *
 * @param tokens Read inside defineMotion, never cached at module load.
 * @param vars   Tween vars. Anything here wins over the token default.
 * @param options A UiSpeed string, or { speed, feel }.
 */
export function ui(
  tokens: MotionTokens,
  vars: gsap.TweenVars = {},
  options: UiSpeed | UiOptions = {},
): gsap.TweenVars {
  const resolved: UiOptions = typeof options === "string" ? { speed: options } : options;
  return {
    duration: tokens.ui[resolved.speed ?? "base"],
    ease: tokens.ui[UI_FEEL_KEY[resolved.feel ?? "out"]],
    ...vars,
  };
}

export interface CineOptions {
  /** Which --dur-cine-* token to use. Default "beat", which is --dur-cine-beat. */
  readonly beat?: CineBeat;
}

/**
 * CINE FAMILY. A-D3 EXPLICITLY DOES NOT APPLY.
 *
 * Long, eased, no overshoot, one ease only. Pinned scenes and scrubbed
 * timelines. The point of a cinematic is that the reader controls the playhead
 * and can stop halfway; a spring that overshoots and settles reads as a glitch
 * when it is being scrubbed backwards through, because it is being played
 * backwards. That is why there is no `feel` here and why --gsap-ease-spring is
 * not reachable from this helper.
 *
 * On a SCRUBBED timeline the duration is not a wall clock. It is the segment's
 * share of the timeline, and scroll distance sets the real pace. So the number
 * still matters: it is what makes one beat twice as long as another. Use
 * "beat" for a step and "phase" for a movement made of steps.
 *
 *   const tl = cineScene(tokens, { trigger: scene, pin: true, end: "+=200%" });
 *   tl.to(carriage, cine(tokens, { x: () => rail.offsetWidth }))
 *     .to(rows,     cine(tokens, { xPercent: 4, stagger: 0 }, "phase"), "<");
 *
 * Transforms only, again. In a scroll loop that is not a style preference, it
 * is the INP budget: a layout property written on every scroll frame forces
 * reflow on the main thread and INP is measured in exactly those frames.
 *
 * @param tokens Read inside defineMotion, never cached at module load.
 * @param vars   Tween vars. Anything here wins over the token default.
 * @param options A CineBeat string, or { beat }.
 */
export function cine(
  tokens: MotionTokens,
  vars: gsap.TweenVars = {},
  options: CineBeat | CineOptions = {},
): gsap.TweenVars {
  const resolved: CineOptions = typeof options === "string" ? { beat: options } : options;
  return {
    duration: tokens.cine[resolved.beat ?? "beat"],
    ease: tokens.cine.ease,
    ...vars,
  };
}

/**
 * The scrub value from tokens. `tight` (--scrub-tight) tracks scroll closely,
 * `loose` (--scrub-loose) trails it and feels heavier.
 *
 * A scrub is a number of SECONDS the playhead takes to catch up to where
 * scroll says it should be. `scrub: true` is not the same thing: it snaps
 * instantly and reads as jitter on a trackpad.
 */
export function scrub(
  tokens: MotionTokens,
  feel: "tight" | "loose" = "tight",
): number {
  return feel === "tight" ? tokens.cine.scrubTight : tokens.cine.scrubLoose;
}

export interface CineSceneConfig {
  /** The element ScrollTrigger measures. Usually the section itself. */
  readonly trigger: Element | string;
  /** What to pin. `true` pins the trigger. Omit for a scrubbed scene with no pin. */
  readonly pin?: Element | string | boolean;
  /** Default "top top": the scene locks when its top reaches the top of the viewport. */
  readonly start?: string;
  /** Default "+=100%": one viewport of scroll drives the whole timeline. */
  readonly end?: string;
  /** Scrub feel. Default "tight". */
  readonly feel?: "tight" | "loose";
  /** Named so it is findable in ScrollTrigger.getAll() when something is off. */
  readonly id?: string;
  /** GSAP's own debug markers. Wire this to a query param, never ship it true. */
  readonly markers?: boolean;
  readonly onUpdate?: (self: ScrollTrigger) => void;
  readonly onRefresh?: (self: ScrollTrigger) => void;
}

/**
 * A pinned, scrubbed CINE timeline with the defaults that make it survive a
 * window resize. Create it inside defineMotion, in the motionOk branch only.
 *
 * THE RESIZE PROBLEM, which is the whole reason this helper exists. A tween
 * written as `{ x: 640 }` bakes 640px in at build time. Resize the window and
 * the carriage still travels 640px down a rail that is now 900px wide, and it
 * stops short with no error anywhere. Two things fix it together, and one
 * without the other does nothing:
 *
 *   1. Write the value as a FUNCTION:  { x: () => rail.offsetWidth }
 *   2. Set invalidateOnRefresh, which this helper does for you. On every
 *      refresh, and a resize causes a refresh, GSAP throws away the recorded
 *      start and end values and calls the function again.
 *
 * Percentage based transforms (xPercent, yPercent) are resize proof by
 * construction and need neither. Prefer them when the motion is relative to
 * the element's own box.
 *
 *   const tl = cineScene(tokens, { trigger: ".scene", pin: true, end: "+=200%" });
 *   tl.to(".carriage", cine(tokens, { x: () => rail.offsetWidth - carriage.offsetWidth }));
 *
 * @returns The timeline. Its ScrollTrigger is on `tl.scrollTrigger`.
 */
export function cineScene(tokens: MotionTokens, config: CineSceneConfig): gsap.core.Timeline {
  return gsap.timeline({
    scrollTrigger: {
      trigger: config.trigger,
      start: config.start ?? "top top",
      end: config.end ?? "+=100%",
      pin: config.pin,
      // Pinning swaps in a spacer element. Without this the swap happens on
      // the frame the pin engages and the panel visibly jumps by a pixel or
      // two on a slower device.
      anticipatePin: config.pin ? 1 : 0,
      pinSpacing: config.pin ? true : undefined,
      scrub: scrub(tokens, config.feel ?? "tight"),
      // The other half of the resize fix. See the note above.
      invalidateOnRefresh: true,
      id: config.id,
      markers: config.markers ?? false,
      onUpdate: config.onUpdate,
      onRefresh: config.onRefresh,
    },
  });
}
