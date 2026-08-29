/**
 * Reveal-on-click mailbox. Initial HTML must not contain the address
 * or a mailto href. This module assembles it after a click.
 */
import { EMAIL_HOST, EMAIL_USER } from "./site";

const REVEAL_ATTR = "data-email-reveal";

function mailbox(): string {
  return `${EMAIL_USER}@${EMAIL_HOST}`;
}

function isRevealLink(el: EventTarget | null): el is HTMLAnchorElement {
  return el instanceof HTMLAnchorElement && el.hasAttribute(REVEAL_ATTR);
}

function reveal(el: HTMLAnchorElement): void {
  const addr = mailbox();
  el.href = `mailto:${addr}`;
  el.textContent = addr;
  el.removeAttribute(REVEAL_ATTR);
}

function onRevealClick(event: Event): void {
  const el = event.currentTarget;
  if (!isRevealLink(el)) return;
  event.preventDefault();
  reveal(el);
}

export function bindRevealEmail(): void {
  document.querySelectorAll<HTMLAnchorElement>(`[${REVEAL_ATTR}]`).forEach((el) => {
    el.addEventListener("click", onRevealClick);
  });
}

bindRevealEmail();
