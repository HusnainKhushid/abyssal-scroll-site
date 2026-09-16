/**
 * Chapter navigation, expressed as a DOM event rather than shared React
 * state — the scroll engine is the only thing that knows where a
 * section actually starts, and nothing needs to re-render for a jump.
 */
export function goto(index: number) {
  document.dispatchEvent(new CustomEvent("abyssal:goto", { detail: index }));
}
