/*
 * Turn a post's free-text location ("Woodlands MRT", "Bugis Junction") into map coordinates.
 *
 * 1. A built-in list of Singapore towns, MRT stations and malls — instant and always works.
 * 2. For anything not on the list, OpenStreetMap's Nominatim, asked one place at a time
 *    (it blocks bursts of requests) with results cached in the browser.
 */

/** @type {Record<string, [number, number]>} */
const SG_PLACES = {
  // Towns / areas
  "ang mo kio": [1.3691, 103.8454], "bedok": [1.3236, 103.9273], "bishan": [1.3508, 103.8485],
  "boon lay": [1.3386, 103.7058], "bukit batok": [1.3496, 103.7499], "bukit merah": [1.2819, 103.8239],
  "bukit panjang": [1.3786, 103.7621], "bukit timah": [1.3294, 103.8021], "buona vista": [1.3072, 103.7903],
  "changi": [1.3644, 103.9915], "changi airport": [1.3644, 103.9915], "choa chu kang": [1.3854, 103.7443],
  "clementi": [1.3151, 103.7652], "dover": [1.3114, 103.7786], "geylang": [1.3181, 103.8870],
  "hougang": [1.3712, 103.8925], "jurong east": [1.3331, 103.7422], "jurong west": [1.3404, 103.7090],
  "jurong": [1.3331, 103.7422], "kallang": [1.3100, 103.8714], "kembangan": [1.3209, 103.9129],
  "marine parade": [1.3026, 103.9070], "pasir ris": [1.3730, 103.9493], "punggol": [1.4052, 103.9024],
  "queenstown": [1.2942, 103.7861], "sembawang": [1.4491, 103.8185], "sengkang": [1.3916, 103.8954],
  "serangoon": [1.3498, 103.8737], "tampines": [1.3540, 103.9437], "toa payoh": [1.3343, 103.8563],
  "woodlands": [1.4360, 103.7860], "yishun": [1.4294, 103.8350], "novena": [1.3204, 103.8438],
  "newton": [1.3138, 103.8380], "orchard": [1.3040, 103.8318], "somerset": [1.3006, 103.8389],
  "dhoby ghaut": [1.2990, 103.8456], "city hall": [1.2931, 103.8520], "raffles place": [1.2840, 103.8514],
  "tanjong pagar": [1.2764, 103.8458], "outram": [1.2803, 103.8395], "chinatown": [1.2844, 103.8439],
  "clarke quay": [1.2884, 103.8465], "bugis": [1.3006, 103.8559], "little india": [1.3066, 103.8496],
  "farrer park": [1.3124, 103.8541], "lavender": [1.3073, 103.8630], "paya lebar": [1.3177, 103.8927],
  "eunos": [1.3197, 103.9030], "aljunied": [1.3164, 103.8829], "simei": [1.3432, 103.9533],
  "tanah merah": [1.3272, 103.9465], "expo": [1.3349, 103.9615], "harbourfront": [1.2653, 103.8222],
  "sentosa": [1.2494, 103.8303], "vivocity": [1.2644, 103.8222], "telok blangah": [1.2708, 103.8099],
  "holland village": [1.3112, 103.7961], "botanic gardens": [1.3224, 103.8150], "tiong bahru": [1.2861, 103.8270],
  "redhill": [1.2896, 103.8168], "commonwealth": [1.3025, 103.7983], "kent ridge": [1.2935, 103.7845],
  "nus": [1.2966, 103.7764], "ntu": [1.3483, 103.6831], "smu": [1.2963, 103.8502],
  "pioneer": [1.3376, 103.6974], "lakeside": [1.3442, 103.7210], "chinese garden": [1.3423, 103.7326],
  "admiralty": [1.4406, 103.8010], "marsiling": [1.4326, 103.7741], "kranji": [1.4251, 103.7619],
  "yew tee": [1.3970, 103.7474], "khatib": [1.4174, 103.8329], "canberra": [1.4430, 103.8297],
  "yio chu kang": [1.3817, 103.8449], "marymount": [1.3487, 103.8394], "caldecott": [1.3378, 103.8395],
  "lorong chuan": [1.3517, 103.8640], "kovan": [1.3602, 103.8851], "buangkok": [1.3829, 103.8930],
  "potong pasir": [1.3313, 103.8690], "boon keng": [1.3196, 103.8617], "macpherson": [1.3266, 103.8899],
  "ubi": [1.3300, 103.8990], "kaki bukit": [1.3349, 103.9089], "bedok north": [1.3347, 103.9180],
  "bedok reservoir": [1.3367, 103.9321], "upper changi": [1.3418, 103.9614], "beauty world": [1.3412, 103.7758],
  "hillview": [1.3626, 103.7674], "king albert park": [1.3357, 103.7832], "sixth avenue": [1.3307, 103.7972],
  "stevens": [1.3200, 103.8259], "marina bay": [1.2763, 103.8545], "bayfront": [1.2819, 103.8590],
  "promenade": [1.2933, 103.8610], "esplanade": [1.2934, 103.8556], "nicoll highway": [1.2999, 103.8636],
  "stadium": [1.3027, 103.8753], "mountbatten": [1.3062, 103.8833], "dakota": [1.3083, 103.8885],
  "east coast park": [1.3008, 103.9122], "east coast": [1.3008, 103.9122], "gardens by the bay": [1.2816, 103.8636],
  "west coast": [1.3034, 103.7645], "pasir panjang": [1.2762, 103.7914], "labrador park": [1.2722, 103.8026],
  "seletar": [1.4040, 103.8692], "lim chu kang": [1.4312, 103.7174], "tengah": [1.3741, 103.7311],
  "bukit gombak": [1.3587, 103.7518], "springleaf": [1.3976, 103.8180], "lentor": [1.3851, 103.8362],
  "mayflower": [1.3720, 103.8366], "bright hill": [1.3626, 103.8335], "upper thomson": [1.3541, 103.8336],
  "thomson": [1.3541, 103.8336], "tai seng": [1.3359, 103.8879], "bartley": [1.3427, 103.8798],
  // Malls & landmarks
  "jurong point": [1.3397, 103.7067], "jem": [1.3333, 103.7432], "westgate": [1.3343, 103.7426],
  "ion orchard": [1.3040, 103.8318], "ion": [1.3040, 103.8318], "ngee ann city": [1.3022, 103.8345],
  "takashimaya": [1.3022, 103.8345], "plaza singapura": [1.3006, 103.8451], "bugis junction": [1.2993, 103.8556],
  "bugis+": [1.3006, 103.8542], "suntec": [1.2953, 103.8586], "marina bay sands": [1.2834, 103.8607],
  "funan": [1.2914, 103.8498], "raffles city": [1.2937, 103.8530], "tampines mall": [1.3526, 103.9447],
  "tampines 1": [1.3543, 103.9452], "century square": [1.3524, 103.9437], "nex": [1.3507, 103.8722],
  "causeway point": [1.4361, 103.7863], "northpoint": [1.4294, 103.8357], "waterway point": [1.4064, 103.9021],
  "compass one": [1.3919, 103.8952], "amk hub": [1.3694, 103.8484], "junction 8": [1.3504, 103.8487],
  "bedok mall": [1.3248, 103.9293], "white sands": [1.3724, 103.9496], "jewel": [1.3602, 103.9898],
  "lot one": [1.3851, 103.7451], "hillion": [1.3787, 103.7630], "bukit panjang plaza": [1.3800, 103.7643],
  "west mall": [1.3500, 103.7491], "the star vista": [1.3068, 103.7880], "clementi mall": [1.3149, 103.7643],
  "imm": [1.3348, 103.7468], "paya lebar quarter": [1.3172, 103.8932], "plq": [1.3172, 103.8932],
  "kallang wave": [1.3030, 103.8752], "city square mall": [1.3113, 103.8566], "mustafa": [1.3099, 103.8556],
  "great world": [1.2935, 103.8318], "parkway parade": [1.3014, 103.9053], "i12 katong": [1.3053, 103.9050],
  "katong": [1.3053, 103.9050], "zhongshan park": [1.3270, 103.8461], "united square": [1.3172, 103.8438],
  "velocity": [1.3204, 103.8438], "toa payoh hub": [1.3324, 103.8478], "sengkang general": [1.3955, 103.8935],
  "national library": [1.2976, 103.8545], "bishan library": [1.3501, 103.8482], "sports hub": [1.3040, 103.8746],
  "zoo": [1.4043, 103.7930], "night safari": [1.4022, 103.7881], "botanic": [1.3138, 103.8159],
};

// Longest names first so "bedok north" wins over "bedok", "jurong point" over "jurong".
const KEYS = Object.keys(SG_PLACES).sort((a, b) => b.length - a.length);

/** @param {string} s */
const norm = (s) => ` ${s.toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim()} `;

/**
 * Instant lookup from the built-in list.
 * @param {string|undefined} name
 * @returns {[number, number] | null}
 */
export function lookupPlace(name) {
  if (!name) return null;
  const n = norm(name);
  for (const k of KEYS) {
    if (n.includes(` ${k} `)) return SG_PLACES[k];
  }
  return null;
}

const CACHE_KEY = "fil-geo-v1";
/** @returns {Record<string, [number, number] | 0>} */
function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
/** @param {Record<string, [number, number] | 0>} c */
function writeCache(c) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* storage unavailable */ }
}

// Rough box around Singapore, so a same-named place abroad is never pinned.
/** @param {number} lat @param {number} lng */
const inSingapore = (lat, lng) => lat > 1.15 && lat < 1.48 && lng > 103.59 && lng < 104.1;

/**
 * Look up names the built-in list doesn't know, one at a time (Nominatim allows ~1 request/second).
 * Calls onFound for each hit so pins can appear as they arrive. Never throws.
 * @param {string[]} names
 * @param {(name: string, coords: [number, number]) => void} onFound
 * @param {AbortSignal} [signal]
 */
export async function geocodeRemaining(names, onFound, signal) {
  const cache = readCache();
  const todo = [];
  for (const name of new Set(names)) {
    const key = name.toLowerCase().trim();
    if (key in cache) { const c = cache[key]; if (c) onFound(name, c); }
    else todo.push(name);
  }
  for (const name of todo.slice(0, 25)) {
    if (signal?.aborted) return;
    try {
      const q = encodeURIComponent(`${name}, Singapore`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=sg`, { signal });
      const data = res.ok ? await res.json() : [];
      const lat = Number(data?.[0]?.lat), lng = Number(data?.[0]?.lon);
      const hit = data?.[0] && inSingapore(lat, lng) ? /** @type {[number, number]} */ ([lat, lng]) : 0;
      if (res.ok) { cache[name.toLowerCase().trim()] = hit; writeCache(cache); }
      if (hit) onFound(name, hit);
    } catch {
      if (signal?.aborted) return;
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
}
