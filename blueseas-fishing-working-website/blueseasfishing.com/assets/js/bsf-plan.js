/* bsf-plan.js — shared matching engine for the trip planner, the members-area
 * species intel and the weekly regional bite brief.
 *
 * Works from one dataset (assets/data/species.json) and one region config
 * (assets/data/brief-regions.json). Pure functions + tiny loaders, no deps.
 * The PHP weekly cron (api/weekly-brief-cron.php) ports the same rules.
 */
(function () {
  'use strict';

  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var MONTH_ALIASES = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
  };
  var SEASON_MONTHS = { spring: [3, 4, 5], summer: [6, 7, 8], fall: [9, 10, 11], autumn: [9, 10, 11], winter: [12, 1, 2] };
  /* first/last month of a season word, so "Spring–Fall" spans Mar..Nov */
  var SEASON_RANGE = { spring: [3, 5], summer: [6, 8], fall: [9, 11], autumn: [9, 11], winter: [12, 2] };

  var state = { species: null, regions: null, inflight: null };

  /* ---------- season parsing ------------------------------------------- */
  /* "Spring–Fall", "May–Sep", "Year-round", "winter tailwaters" -> [1..12] */
  function monthsFor(seasonText) {
    var s = String(seasonText || '').toLowerCase();
    if (!s) return null;                                   // unknown -> caller decides
    if (/(year[- ]?round|all year|all year round|any time|anytime)/.test(s)) return [1,2,3,4,5,6,7,8,9,10,11,12];
    var months = {};
    // explicit "Jan-Mar" / "May to Sep" / "Spring–Fall" ranges
    var re = /([a-z]{3,9})\s*(?:-|–|—|to|\.\.)\s*([a-z]{3,9})/g, m;
    while ((m = re.exec(s))) {
      var range = SEASON_RANGE[m[1]] || SEASON_RANGE[m[2]];
      var a = MONTH_ALIASES[m[1]] || (range && SEASON_RANGE[m[1]] ? range[0] : 0);
      var b = MONTH_ALIASES[m[2]] || (SEASON_RANGE[m[2]] ? SEASON_RANGE[m[2]][1] : (range ? range[1] : 0));
      if (a && b) { for (var i = a; ; i = i === 12 ? 1 : i + 1) { months[i] = 1; if (i === b) break; } }
    }
    // lone months: "Jun", "September"
    s.replace(/[a-z]{3,9}/g, function (w) { if (MONTH_ALIASES[w]) months[MONTH_ALIASES[w]] = 1; return w; });
    // season words (only when no month tokens were found nearby, keep both)
    Object.keys(SEASON_MONTHS).forEach(function (word) {
      if (new RegExp('\\b' + word).test(s)) SEASON_MONTHS[word].forEach(function (mo) { months[mo] = 1; });
    });
    var list = Object.keys(months).map(Number);
    return list.length ? list.sort(function (a, b) { return a - b; }) : null;
  }

  function inSeason(speciesRow, month) {
    var months = monthsFor(speciesRow.season);
    // no parsable window -> treat as in-season (many profiles use prose like
    // "warm months"); the brief shows the raw season text either way.
    if (!months) return true;
    return months.indexOf(month) !== -1;
  }

  /* ---------- region matching ------------------------------------------ */
  function normalize(s) { return String(s || '').toLowerCase(); }

  function regionScore(speciesRow, regionDef) {
    if (!regionDef) return 0;
    if (regionDef.env && normalize(speciesRow.env).indexOf(normalize(regionDef.env)) !== -1) return 2;
    var hay = normalize([speciesRow.regions && speciesRow.regions.join(' '),
                         speciesRow.habitat, speciesRow.name].join(' '));
    var score = 0;
    (regionDef.match || []).forEach(function (kw) {
      if (kw && hay.indexOf(normalize(kw)) !== -1) score += 2;
    });
    return score;
  }

  function destinationScore(speciesRow, destName) {
    if (!destName) return 0;
    var key = normalize(destName).replace(/\s*\(.*?\)\s*/g, ' ').trim();  // "Florida reefs (US)" -> "florida reefs"
    if (!key) return 0;
    var hay = normalize((speciesRow.regions || []).join(' ') + ' ' + speciesRow.habitat + ' ' + speciesRow.name);
    if (hay.indexOf(key) !== -1) return 4;
    // all significant words present (order-free): "great lakes" matches "Lakes Erie + Huron (Great Lakes)"
    var words = key.split(/\s+/).filter(function (w) { return w.length > 2 && ['and','the','of'].indexOf(w) === -1; });
    if (words.length && words.every(function (w) { return hay.indexOf(w) !== -1; })) return 3;
    return 0;
  }

  /* ---------- plan building -------------------------------------------- */
  /* opts: { region: regionDef, destination: string, month: 1-12,
   *         env: 'Freshwater'|'Saltwater'|'', limit: n } */
  function buildPlan(speciesList, opts) {
    opts = opts || {};
    var month = opts.month || (new Date().getMonth() + 1);
    var limit = opts.limit || 12;
    var scored = [];
    (speciesList || []).forEach(function (row) {
      if (opts.env && normalize(row.env).indexOf(normalize(opts.env)) === -1) return;
      var score = regionScore(row, opts.region) + destinationScore(row, opts.destination);
      if (opts.destination && score === 0) return;          // destination trips only list matches
      if (!opts.destination && opts.region && score === 0) return;
      if (!opts.destination && !opts.region) score = 1;     // global browse (env filter already applied)
      if (!inSeason(row, month)) score -= 1;                // demote off-season, don't hide
      if (score <= 0) return;
      scored.push({ row: row, score: score, inSeason: inSeason(row, month) });
    });
    scored.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      if (b.inSeason !== a.inSeason) return b.inSeason ? 1 : -1;
      return a.row.name.localeCompare(b.row.name);
    });
    return scored.slice(0, limit);
  }

  /* ---------- weekly brief --------------------------------------------- */
  function buildBrief(speciesList, regionDef, month) {
    var top = buildPlan(speciesList, { region: regionDef, month: month, limit: 6 });
    var off = buildPlan(speciesList, { region: regionDef, month: month, limit: 10 }).slice(0, 3);
    return { inSeason: top, alsoPresent: off };
  }

  /* ---------- loaders ---------------------------------------------------- */
  function loadJSON(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
      return r.json();
    });
  }

  function loadSpecies() {
    if (state.species) return Promise.resolve(state.species);
    if (!state.inflight) {
      state.inflight = loadJSON('/assets/data/species.json').then(function (j) {
        state.species = j.species || [];
        return state.species;
      }).catch(function (e) { state.inflight = null; throw e; });
    }
    return state.inflight;
  }

  function loadRegions() {
    if (state.regions) return Promise.resolve(state.regions);
    return loadJSON('/assets/data/brief-regions.json').then(function (j) {
      state.regions = j.regions || [];
      return state.regions;
    });
  }

  window.BSF_PLAN = {
    monthsFor: monthsFor,
    inSeason: inSeason,
    regionScore: regionScore,
    destinationScore: destinationScore,
    buildPlan: buildPlan,
    buildBrief: buildBrief,
    loadSpecies: loadSpecies,
    loadRegions: loadRegions,
    MONTHS: MONTHS
  };
})();
