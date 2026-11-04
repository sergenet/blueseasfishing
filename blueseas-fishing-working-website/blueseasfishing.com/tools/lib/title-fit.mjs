// tools/lib/title-fit.mjs — keep <title> short enough to survive Google's cut.
//
// Google truncates a result title at roughly 600px, which is about 60
// characters of Latin text. A title longer than that is not "wrong", but the
// part that gets dropped is always the tail — and on this site the tail is the
// brand, or the species/season qualifier the page is actually targeting, so an
// over-long template silently spends its best words on text nobody sees.
//
// Measured 2026-11-02: 984 of 1,228 English pages exceeded 60 characters
// (species 496/549, destinations 95/97, states 366/385, max 87) because every
// template appended a fixed 20-character brand to a name that is itself
// 20–30 characters long.
//
// The rule these generators now follow: give a ladder of candidates from the
// richest to the barest, and take the first one that fits. Short names keep the
// full branded title; long names degrade to a keyword-only title rather than
// handing Google a truncated string.
//
// Length is measured on the *rendered* title, so an entity like `&amp;` or
// `&#39;` counts as the single character it displays as, not the five or six
// characters it occupies in the HTML.

const ENTITY = /&(?:[a-z][a-z0-9]*|#\d+|#x[\da-f]+);/gi;

/** Display length of a title: entities collapse to the one character they render as. */
export function titleLen(value) {
  return String(value == null ? '' : value).replace(ENTITY, 'X').length;
}

/** Google's practical display limit. */
export const TITLE_MAX = 60;

/**
 * First candidate whose rendered length is <= max.
 *
 * Candidates must be ordered richest-first and the last must be short enough
 * to stand alone — it is what a caller gets when even the barest form is too
 * long, and a title that is merely short still beats one that is truncated.
 */
export function fitTitle(candidates, max = TITLE_MAX) {
  const list = (Array.isArray(candidates) ? candidates : [candidates])
    .filter((c) => c && String(c).trim());
  if (!list.length) throw new Error('fitTitle: no usable candidates');
  for (const c of list) {
    if (titleLen(c) <= max) return c;
  }
  return list[list.length - 1];
}
