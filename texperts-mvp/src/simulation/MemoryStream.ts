import { MemoryEntry } from "@/types";

let memoryCounter = 0;

/**
 * Append-only memory stream with retrieval scoring.
 * Each agent has their own MemoryStream.
 */
export class MemoryStream {
  private entries: MemoryEntry[] = [];

  add(entry: Omit<MemoryEntry, "id" | "last_accessed">): void {
    this.entries.push({
      ...entry,
      id: `mem_${++memoryCounter}`,
      last_accessed: entry.tick,
    });
  }

  /** Get all entries (most recent first). */
  getAll(): MemoryEntry[] {
    return [...this.entries].reverse();
  }

  /** Get top-K most relevant entries given a context. */
  retrieve(currentTick: number, context: string, k = 10): MemoryEntry[] {
    if (this.entries.length === 0) return [];

    const contextKeywords = extractKeywords(context);

    const scored = this.entries.map((entry) => {
      // Recency: exponential decay
      const age = currentTick - entry.tick;
      const recency = Math.exp(-age * 0.1);

      // Importance: normalized 0-1
      const importance = entry.importance / 10;

      // Relevance: keyword overlap (Jaccard similarity)
      const entryKeywords = new Set(entry.embedding_keywords);
      const intersection = contextKeywords.filter((k) => entryKeywords.has(k)).length;
      const union = new Set([...contextKeywords, ...entry.embedding_keywords]).size;
      const relevance = union > 0 ? intersection / union : 0;

      const score = recency + importance + relevance;

      return { entry, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Update last_accessed
    const topK = scored.slice(0, k);
    for (const s of topK) {
      s.entry.last_accessed = currentTick;
    }

    return topK.map((s) => s.entry);
  }

  /** Get recent entries of a specific type. */
  getRecent(type?: MemoryEntry["type"], limit = 10): MemoryEntry[] {
    let filtered = this.entries;
    if (type) {
      filtered = filtered.filter((e) => e.type === type);
    }
    return filtered.slice(-limit).reverse();
  }

  /** Sum of importance scores for un-reflected observations since last reflection. */
  getUnreflectedImportanceSum(): number {
    let sum = 0;
    // Walk backwards from latest
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      if (entry.type === "reflection") break; // stop at last reflection
      if (entry.type === "observation") {
        sum += entry.importance;
      }
    }
    return sum;
  }

  get length(): number {
    return this.entries.length;
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction: lowercase, split, filter stopwords
  const stopwords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "about", "like",
    "through", "after", "over", "between", "out", "against", "during",
    "before", "above", "below", "and", "but", "or", "not", "no", "so",
    "if", "than", "too", "very", "just", "that", "this", "it", "i", "we",
    "you", "they", "he", "she", "my", "your", "his", "her", "our", "their",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
}
