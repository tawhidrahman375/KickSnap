/**
 * The Kick clipping-program streamer list — THIS IS THE WHOLE SUPPORTED SET.
 * Only these streamers exist in the selector; there is no "other" fallback. A
 * streamer not on this list is handled by letting the user import their own
 * overlay PNG in the editor.
 *
 * SOURCE OF TRUTH = the public/overlays folder. Every streamer below has a real
 * Kick overlay PNG at public/overlays/<slug>.png. Streamers without a matching
 * PNG were removed — the folder decides who exists, not this list.
 *
 * `rate` = USD per 100K views (official creator-command rate).
 * `pop`  = fallback popularity, used to order everyone NOT in the trending list.
 * `overlay` = the real Kick overlay PNG for that streamer (in public/overlays).
 *
 * TRENDING (below) is the source of truth for both the 🔥 badge and the top of
 * the selector — edit that list to re-curate. `fire` is derived from it, so the
 * per-row `fire` flags in DATA are ignored and kept only for reference.
 */

// slug, display name, rate, popularity, fire. Ordered roughly by popularity.
const DATA = [
  { slug: 'adinross', name: 'Adin Ross', rate: 30, pop: 100, fire: true },
  { slug: 'xqc', name: 'xQc', rate: 15, pop: 99, fire: true },
  { slug: 'ryangarcia', name: 'Ryan Garcia', rate: 20, pop: 98, fire: true },
  { slug: 'n3on', name: 'N3on', rate: 30, pop: 97, fire: true },
  { slug: 'sneako', name: 'Sneako', rate: 25, pop: 96, fire: true },
  { slug: 'asmongold', name: 'Asmongold', rate: 10, pop: 95, fire: true },
  { slug: 'akademiks', name: 'Akademiks', rate: 20, pop: 94, fire: true },
  { slug: 'trainwreckstv', name: 'Trainwreckstv', rate: 40, pop: 93, fire: true },
  { slug: 'jackdoherty', name: 'Jack Doherty', rate: 30, pop: 92, fire: true },
  { slug: 'iceposeidon', name: 'Ice Poseidon', rate: 30, pop: 91, fire: true },
  { slug: '6ix9ine', name: '6ix9ine', rate: 20, pop: 90, fire: true },
  { slug: 'mizkif', name: 'Mizkif', rate: 40, pop: 87, fire: true },
  { slug: 'chrisean', name: 'Chrisean', rate: 30, pop: 86, fire: true },
  { slug: 'jidion', name: 'JiDion', rate: 30, pop: 85, fire: true },
  { slug: 'ansem', name: 'Ansem', rate: 40, pop: 84, fire: true },
  { slug: 'larrywheels', name: 'Larry Wheels', rate: 15, pop: 83, fire: true },
  { slug: 'lospollostv', name: 'LosPollosTV', rate: 30, pop: 82, fire: true },
  { slug: 'rampagejackson', name: 'Rampage Jackson', rate: 20, pop: 81, fire: false },
  { slug: 'conorbenn', name: 'Conor Benn', rate: 40, pop: 79, fire: false },
  { slug: 'adrienbroner', name: 'Adrien Broner', rate: 10, pop: 78, fire: false },
  { slug: 'michaelbeasley', name: 'Michael Beasley', rate: 30, pop: 77, fire: false },
  { slug: 'gymskin', name: 'Gymskin', rate: 30, pop: 76, fire: false },
  { slug: 'clavicular', name: 'Clavicular', rate: 15, pop: 75, fire: false },
  { slug: 'odablock', name: 'Odablock', rate: 40, pop: 74, fire: false },
  { slug: 'hstikkytokky', name: 'HStikkyTokky', rate: 25, pop: 73, fire: false },
  { slug: 'celinapowell', name: 'Celina Powell', rate: 40, pop: 72, fire: false },
  { slug: 'amandasoliss', name: 'Amanda Soliss', rate: 20, pop: 71, fire: false },
  { slug: 'ashtonhall', name: 'Ashton Hall', rate: 10, pop: 70, fire: false },
  { slug: 'konvy', name: 'Konvy', rate: 40, pop: 69, fire: false },
  { slug: 'deenthegreat', name: 'DeenTheGreat', rate: 10, pop: 67, fire: false },
  { slug: 'iamtiagz', name: 'iamtiagz', rate: 40, pop: 66, fire: false },
  { slug: 'cheesur', name: 'Cheesur', rate: 40, pop: 65, fire: false },
  { slug: 'cuffem', name: 'Cuffem', rate: 40, pop: 64, fire: false },
  { slug: 'messymaj', name: 'MessyMaj', rate: 40, pop: 63, fire: false },
  { slug: 'dillonxlatham', name: 'Dillon Latham', rate: 30, pop: 62, fire: false },
  { slug: 'jackjoseph', name: 'Jack Joseph', rate: 40, pop: 61, fire: false },
  { slug: 'woodyandkleiny', name: 'Woody & Kleiny', rate: 40, pop: 60, fire: false },
  { slug: 'ninadrama', name: 'NinaDrama', rate: 20, pop: 59, fire: false },
  { slug: 'tjr', name: 'TJR', rate: 20, pop: 58, fire: false },
  { slug: 'cortezmma', name: 'Cortez MMA', rate: 30, pop: 55, fire: false },
  { slug: 'yera', name: 'Yera', rate: 30, pop: 53, fire: false },
  { slug: 'chuzzington', name: 'Chuzzington', rate: 30, pop: 52, fire: false },
  { slug: 'fiivestar', name: 'FiiveStar', rate: 30, pop: 51, fire: false },
  { slug: 'blondish', name: 'Blondish', rate: 40, pop: 50, fire: false },
  { slug: 'camcasey', name: 'Cam Casey', rate: 40, pop: 49, fire: false },
  { slug: 'vinceaesthetic', name: 'Vince Aesthetic', rate: 40, pop: 48, fire: false },
  { slug: 'jrakey', name: 'JRakey', rate: 40, pop: 47, fire: false },
  { slug: 'j2hundred', name: 'J2Hundred', rate: 40, pop: 46, fire: false },
  { slug: 'dgdecor', name: 'DG Decor', rate: 40, pop: 45, fire: false },
  { slug: 'king68thegreat', name: 'King68TheGreat', rate: 40, pop: 44, fire: false },
  { slug: 'tyriquehyde', name: 'Tyrique Hyde', rate: 40, pop: 43, fire: false },
  { slug: 'connorsinann', name: 'Connor Sinann', rate: 40, pop: 42, fire: false },
  { slug: 'noahprice69', name: 'Noah Price', rate: 40, pop: 41, fire: false },
  { slug: 'isaacfrancis', name: 'Isaac Francis', rate: 40, pop: 40, fire: false },
  { slug: 'kingsamjonesiii', name: 'King Sam Jones III', rate: 40, pop: 39, fire: false },
  { slug: 'ethanqi', name: 'Ethan Qi', rate: 40, pop: 38, fire: false },
  { slug: 'jeanemarie', name: 'Jeane Marie', rate: 40, pop: 37, fire: false },
  { slug: 'bigmeech4life', name: 'BigMeech4Life', rate: 40, pop: 36, fire: false },
  { slug: 'fafafitness11', name: 'Fafa Fitness', rate: 40, pop: 35, fire: false },
  { slug: 'babyrich1k', name: 'BabyRich1k', rate: 30, pop: 31, fire: false },
  { slug: 'chowbabygirl', name: 'ChowBabyGirl', rate: 30, pop: 30, fire: false },
  { slug: 'derekking', name: 'Derek King', rate: 30, pop: 29, fire: false },
  { slug: 'blame', name: 'Blame', rate: 30, pop: 28, fire: false },
  { slug: 'edmatthews', name: 'Ed Matthews', rate: 27, pop: 26, fire: false },
  { slug: 'flaminhotmitts', name: 'FlaminHotMitts', rate: 25, pop: 25, fire: false },
  { slug: 'oblivionsw', name: 'OblivionSW', rate: 20, pop: 24, fire: false },
  { slug: 'zavalahimself', name: 'Zavala', rate: 20, pop: 23, fire: false },
  { slug: 'eedwinrg', name: 'EedwinRG', rate: 20, pop: 22, fire: false },
  { slug: 'gemelojmc', name: 'GemeloJMC', rate: 20, pop: 21, fire: false },
  { slug: 'androgenic', name: 'Androgenic', rate: 20, pop: 20, fire: false },
  { slug: 'alexbigred', name: 'Alex BigRed', rate: 20, pop: 19, fire: false },
  { slug: 'vinnythetwister', name: 'Vinny The Twister', rate: 20, pop: 17, fire: false },
]

// Curated trending order — the top of the selector, in THIS order, each with a
// 🔥 badge. Everyone not listed here follows below, ordered by `pop`. Edit this
// list to re-curate trending.
const TRENDING = [
  // top 6 — hero slots
  'n3on', 'deenthegreat', 'adrienbroner', 'clavicular', 'adinross', 'xqc',
  // rest of the marquee names
  'ryangarcia', 'sneako', 'jackdoherty', 'trainwreckstv', 'akademiks',
  'jidion', 'larrywheels', 'lospollostv', 'asmongold',
  // priority trending
  'rampagejackson', 'gymskin', 'amandasoliss', 'hstikkytokky', 'konvy',
  'ashtonhall', 'iamtiagz', 'cheesur', 'cuffem', 'dillonxlatham', 'tjr',
  'connorsinann', 'ethanqi', 'oblivionsw', 'edmatthews', 'zavalahimself', 'androgenic',
  // still trending but nudged lower
  'iceposeidon', '6ix9ine', 'mizkif', 'chrisean',
  // (ansem intentionally dropped from trending)
]
const TREND_INDEX = Object.fromEntries(TRENDING.map((s, i) => [s, i]))

export const STREAMERS = DATA.map((s) => ({
  ...s,
  overlay: `/overlays/${s.slug}.png`,
  fire: s.slug in TREND_INDEX, // 🔥 badge = trending membership
}))

export function streamerInitials(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Trending first (in curated order), then everyone else by popularity.
export const STREAMERS_BY_POP = [...STREAMERS].sort((a, b) => {
  const ai = a.slug in TREND_INDEX ? TREND_INDEX[a.slug] : Infinity
  const bi = b.slug in TREND_INDEX ? TREND_INDEX[b.slug] : Infinity
  if (ai !== bi) return ai - bi
  return b.pop - a.pop
})
