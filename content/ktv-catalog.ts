import type { Song } from "@/lib/ktv/types";

// ---------------------------------------------------------------------------
// Seed / fallback songbook for the street-KTV audience page.
//
// The live source of truth is Vercel KV (`ktv:catalog`), written by the
// performer app via PUT /api/ktv/catalog whenever the local repertoire
// changes. This file is what `loadCatalog()` falls back to when KV is
// unset (local dev) or empty (first deploy, before the app has synced).
//
// Editing this file no longer affects production once the app has done
// at least one sync — change the songbook in the app instead. Keep this
// list short and roughly representative as the seed.
// ---------------------------------------------------------------------------

export const catalog: Song[] = [
  // -- Mandopop & Cantopop --
  {
    id: "moon-tells-my-heart",
    title: "月亮代表我的心",
    artist: "鄧麗君",
    language: "zh",
    key: "C",
    durationSec: 220,
    tags: ["ballad", "classic"],
  },
  {
    id: "ningxia",
    title: "寧夏",
    artist: "梁靜茹",
    language: "zh",
    key: "F",
    durationSec: 235,
    tags: ["ballad", "summer"],
  },
  {
    id: "qili-xiang",
    title: "七里香",
    artist: "周杰倫",
    language: "zh",
    durationSec: 295,
    tags: ["ballad"],
  },
  {
    id: "tongnian",
    title: "童年",
    artist: "羅大佑",
    language: "zh",
    key: "G",
    durationSec: 270,
    tags: ["folk", "classic"],
  },
  {
    id: "houlai",
    title: "後來",
    artist: "劉若英",
    language: "zh",
    durationSec: 310,
    tags: ["ballad"],
  },
  {
    id: "haikuo-tiankong",
    title: "海闊天空",
    artist: "Beyond",
    language: "zh",
    key: "C",
    durationSec: 320,
    tags: ["rock", "anthem"],
  },
  {
    id: "pengyou",
    title: "朋友",
    artist: "周華健",
    language: "zh",
    durationSec: 260,
    tags: ["ballad"],
  },

  // -- English --
  {
    id: "imagine",
    title: "Imagine",
    artist: "John Lennon",
    language: "en",
    key: "C",
    durationSec: 183,
    tags: ["classic", "piano"],
  },
  {
    id: "wonderwall",
    title: "Wonderwall",
    artist: "Oasis",
    language: "en",
    key: "F#m",
    durationSec: 258,
    tags: ["britpop", "singalong"],
  },
  {
    id: "let-it-be",
    title: "Let It Be",
    artist: "The Beatles",
    language: "en",
    key: "C",
    durationSec: 243,
    tags: ["classic", "piano"],
  },
  {
    id: "stand-by-me",
    title: "Stand By Me",
    artist: "Ben E. King",
    language: "en",
    key: "A",
    durationSec: 178,
    tags: ["soul", "classic"],
  },
  {
    id: "just-the-way-you-are",
    title: "Just the Way You Are",
    artist: "Bruno Mars",
    language: "en",
    durationSec: 220,
    tags: ["pop", "ballad"],
  },
  {
    id: "hey-jude",
    title: "Hey Jude",
    artist: "The Beatles",
    language: "en",
    key: "F",
    durationSec: 431,
    tags: ["classic", "long"],
  },
  {
    id: "perfect",
    title: "Perfect",
    artist: "Ed Sheeran",
    language: "en",
    durationSec: 263,
    tags: ["pop", "ballad", "wedding"],
  },
  {
    id: "hotel-california",
    title: "Hotel California",
    artist: "Eagles",
    language: "en",
    key: "Bm",
    durationSec: 391,
    tags: ["rock", "guitar"],
  },
];
