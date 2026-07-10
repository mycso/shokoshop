/**
 * Serializes a JSON-LD object for embedding in a <script type="application/ld+json">
 * tag, escaping "<" so the payload can never break out of the script tag
 * (e.g. a product name containing "</script>").
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
