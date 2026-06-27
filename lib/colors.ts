export const COLOR_MAP: Record<string, string> = {
  // Core colors
  "white": "#FFFFFF", "black": "#111111",
  "red": "#CC0000", "scarlet": "#FF2400", "crimson": "#DC143C",
  "blue": "#2B64B8", "navy": "#1B2A4A", "navy blue": "#1B2A4A",
  "royal blue": "#2B64B8", "royal": "#2B64B8", "cobalt": "#0047AB",
  "green": "#2D6A2D", "forest green": "#2D6A2D", "kelly green": "#4CBB17",
  "yellow": "#FFD700", "gold": "#C9A800", "old gold": "#CFB53B",
  "orange": "#FF6600", "coral": "#FF6B6B",
  "purple": "#6A0DAD", "violet": "#7F00FF", "iris": "#5A4FCF",
  "pink": "#FF69B4", "hot pink": "#FF1493", "rose": "#E8005A",

  // Greys / neutrals
  "grey": "#9E9E9E", "gray": "#9E9E9E",
  "heather": "#B2B2B2", "heather grey": "#B2B2B2", "heather gray": "#B2B2B2",
  "athletic heather": "#C0C0C0", "graphite heather": "#505050", "deep heather": "#404040",
  "sport grey": "#C0C0C0", "sport gray": "#C0C0C0",
  "ice grey": "#E0E0E0", "ice gray": "#E0E0E0",
  "ash": "#B2BEB5", "charcoal": "#36454F", "graphite": "#383838", "silver": "#C0C0C0",
  "dark grey": "#555555", "dark gray": "#555555", "dark heather": "#3D3D3D",
  "slate": "#708090", "tweed": "#9C8C78",

  // Whites / off-whites
  "natural": "#F5F5DC", "cream": "#FFFDD0", "off white": "#FAF9F6",
  "vintage white": "#F5F5F0", "sand": "#F4E2C0", "cornsilk": "#FFF8DC",
  "prairie dust": "#C2A882",

  // Blues / teals
  "midnight": "#191F45", "legion blue": "#004B87", "denim": "#1560BD",
  "sapphire": "#0F52BA", "antique sapphire": "#1F4C6B",
  "carolina blue": "#56A0D3", "carolina": "#56A0D3",
  "light blue": "#87CEEB", "sky blue": "#87CEEB",
  "teal": "#008080", "aqua": "#00CED1", "turquoise": "#40E0D0",
  "seafoam": "#9FE2BF", "mint": "#98FF98",

  // Reds / pinks
  "maroon": "#800000", "burgundy": "#800020", "cardinal": "#C41E3A",
  "garnet": "#6B0F1A", "brick": "#CB4154", "cayenne": "#9B2335",
  "paprika": "#8D0000", "antique cherry red": "#9D1A1A", "rust": "#B7410E",
  "heliconia": "#F4538A", "azalea": "#F7A8C0",
  "blush": "#DE5D83", "light pink": "#FFB6C1", "pale pink": "#FADADD",
  "berry": "#8B1A4A", "blackberry": "#4B0082",
  "fuchsia": "#FF00FF",

  // Purples / lavenders
  "lavender": "#C8A2C8", "lilac": "#C8A2C8", "orchid": "#DA70D6",
  "wisteria": "#C9A0DC", "indigo": "#3F00FF",

  // Yellows / oranges
  "daisy": "#FFD700", "amber": "#FFBF00", "lemon": "#FFF44F",
  "texas orange": "#C84B2F", "tennessee orange": "#FF6F00",
  "safety orange": "#FF6700", "sunset": "#F9A03F",

  // Greens
  "military green": "#4B5320", "olive": "#808000",
  "lime": "#32CD32", "safety green": "#39FF14",
  "jade dome": "#2E8B57", "jade": "#00A86B",
  "moss": "#8A9A5B",

  // Browns / tans
  "beige": "#F5F5DC", "tan": "#D2B48C", "brown": "#8B4513",
  "chestnut": "#954535", "stone": "#8A8070",
};

const LIGHT_COLORS = new Set([
  "#FFFFFF", "#FAF9F6", "#FFFDD0", "#F5F5DC", "#F5F5F0", "#F4E2C0",
  "#E6E6FA", "#C8A2C8", "#E0E0E0", "#FFB6C1", "#FADADD", "#C0C0C0",
  "#B2BEB5", "#B2B2B2", "#E8E8E8", "#98FF98", "#9FE2BF", "#FFF8DC",
  "#FFF44F", "#FFBF00", "#C2A882", "#F7A8C0", "#C9A0DC",
]);

export function isLightColor(hex: string): boolean {
  return LIGHT_COLORS.has(hex);
}

/** Returns the closest hex for any color name — never null. */
export function colorHex(name: string): string {
  const lower = name.toLowerCase().trim();

  // 1. Exact match
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];

  // 2. Name contains a map key as substring — prefer longest (most specific)
  let best: string | null = null;
  let bestLen = 0;
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key) && key.length > bestLen) {
      bestLen = key.length;
      best = hex;
    }
  }
  if (best) return best;

  // 3. Word-level overlap — score by total length of shared words
  const nameWords = lower.split(/[\s-]+/);
  let wordBest: string | null = null;
  let wordBestScore = 0;
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    const score = key
      .split(/[\s-]+/)
      .reduce((s, kw) => (nameWords.includes(kw) ? s + kw.length : s), 0);
    if (score > wordBestScore) {
      wordBestScore = score;
      wordBest = hex;
    }
  }
  if (wordBest) return wordBest;

  // 4. Fallback: neutral grey
  return "#9E9E9E";
}
