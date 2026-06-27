export const CATEGORIES = [
  { slug: "music",   label: "Music",   emoji: "🎵", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { slug: "sports",  label: "Sports",  emoji: "⚽", color: "bg-green-100 text-green-700 border-green-200" },
  { slug: "films",   label: "Films",   emoji: "🎬", color: "bg-red-100 text-red-700 border-red-200" },
  { slug: "kids",    label: "Kids",    emoji: "🧸", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { slug: "art",     label: "Art",     emoji: "🎨", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { slug: "culture", label: "Culture", emoji: "🌍", color: "bg-blue-100 text-blue-700 border-blue-200" },
] as const;

export type CategorySlug = typeof CATEGORIES[number]["slug"];

export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

// Keywords scored per category — higher score wins when text matches multiple
const KEYWORDS: Record<CategorySlug, string[]> = {
  music: [
    "music", "musician", "band", "singer", "rapper", "artist", "album", "song", "track",
    "concert", "festival", "guitar", "drums", "piano", "bass", "vinyl", "afrobeat", "jazz",
    "hip hop", "hiphop", "rap", "rock", "pop", "r&b", "rnb", "soul", "funk", "reggae",
    "blues", "grime", "dancehall", "highlife", "dj", "producer", "fela", "kuti", "bowie",
    "tupac", "biggie", "legend", "icon", "lyric",
  ],
  sports: [
    "sport", "sports", "football", "soccer", "basketball", "tennis", "cricket", "rugby",
    "athlete", "player", "team", "match", "championship", "league", "olympic", "fitness",
    "gym", "running", "swimming", "boxing", "mma", "golf", "cycling", "baseball", "hockey",
    "volleyball", "marathon", "race", "trophy", "goal", "stadium",
  ],
  films: [
    "film", "movie", "cinema", "actor", "actress", "director", "scene", "hollywood",
    "bollywood", "tv", "television", "show", "series", "character", "superhero", "marvel",
    "dc comics", "anime", "cartoon", "animation", "blockbuster", "oscar", "bafta", "screen",
    "sequel", "franchise", "sci-fi", "thriller", "horror", "comedy", "drama",
  ],
  kids: [
    "kids", "children", "child", "baby", "toddler", "nursery", "school", "playground",
    "unicorn", "dinosaur", "teddy", "toy", "cute", "kawaii", "cartoon", "magical",
    "fairy", "princess", "superhero", "minecraft", "roblox", "pokemon",
  ],
  art: [
    "art", "abstract", "painting", "illustration", "graphic", "design", "pattern", "texture",
    "surreal", "modern", "vintage", "retro", "aesthetic", "minimalist", "bold", "print",
    "artwork", "canvas", "sketch", "draw", "portrait", "landscape", "typography",
  ],
  culture: [
    "culture", "cultural", "heritage", "tradition", "traditional", "history", "historical",
    "african", "africa", "afro", "asian", "asia", "caribbean", "latin", "european",
    "indigenous", "diaspora", "pride", "identity", "flag", "nation", "world", "global",
    "mythology", "folklore", "spiritual", "tribe", "ancestor",
  ],
};

/**
 * Scores the text against each category's keywords and returns the best match,
 * or null if nothing scores above zero.
 */
export function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  let best: { label: string; score: number } | null = null;

  for (const cat of CATEGORIES) {
    const score = KEYWORDS[cat.slug].reduce(
      (acc, kw) => acc + (lower.includes(kw) ? 1 : 0),
      0
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { label: cat.label, score };
    }
  }

  return best?.label ?? null;
}
