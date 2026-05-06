

// AI-enhanced matching algorithm
// Score is 0-100, representing match confidence percentage
export function findMatches(targetItem, allItems) {
  const oppositeType = targetItem.type === "lost" ? "found" : "lost";
  const candidates = allItems.filter(
    (item) =>
      item.type === oppositeType &&
      item.status === "active" &&
      item.id !== targetItem.id
  );

  const scored = candidates.map((item) => {
    let score = 0;

    // Category match (40 pts)
    if (item.category === targetItem.category) score += 40;

    // Location proximity (30 pts)
    if (targetItem.latitude && targetItem.longitude && item.latitude && item.longitude) {
      const dist = getDistanceKm(
        targetItem.latitude, targetItem.longitude,
        item.latitude, item.longitude
      );
      if (dist < 0.5) score += 30;
      else if (dist < 1) score += 25;
      else if (dist < 2) score += 20;
      else if (dist < 5) score += 10;
    }

    // Date proximity (20 pts)
    if (targetItem.date_lost_found && item.date_lost_found) {
      const daysDiff = Math.abs(
        (new Date(targetItem.date_lost_found) - new Date(item.date_lost_found)) /
          (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 1) score += 20;
      else if (daysDiff <= 3) score += 15;
      else if (daysDiff <= 7) score += 10;
      else if (daysDiff <= 14) score += 5;
    }

    // Description keyword overlap (10 pts max)
    if (targetItem.description && item.description) {
      const targetWords = new Set(
        targetItem.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      );
      const itemWords = new Set(
        item.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      );
      const overlap = [...targetWords].filter((w) => itemWords.has(w)).length;
      score += Math.min(overlap * 3, 10);
    }

    // Title keyword overlap (bonus up to 5 pts)
    if (targetItem.title && item.title) {
      const tWords = new Set(targetItem.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
      const iWords = new Set(item.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
      const overlap = [...tWords].filter((w) => iWords.has(w)).length;
      score += Math.min(overlap * 2, 5);
    }

    // Cap at 100
    const percentage = Math.min(Math.round(score), 100);

    return { item, score, percentage };
  });

  return scored
    .filter((s) => s.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// AI-powered match analysis — calls LLM to compare two items
export async function analyzeMatchWithAI(item1, item2) {
  const prompt = `You are a lost-and-found matching assistant. Compare these two items and determine if they are likely the same item.

Item A (${item1.type.toUpperCase()}):
- Title: ${item1.title}
- Category: ${item1.category}
- Description: ${item1.description || "N/A"}
- Location: ${item1.location_name || "N/A"}
- Date: ${item1.date_lost_found || "N/A"}

Item B (${item2.type.toUpperCase()}):
- Title: ${item2.title}
- Category: ${item2.category}
- Description: ${item2.description || "N/A"}
- Location: ${item2.location_name || "N/A"}
- Date: ${item2.date_lost_found || "N/A"}

Return a JSON with:
- match_percentage: number 0-100
- reasoning: short 1-sentence explanation
- is_likely_match: boolean (true if >= 60%)`;

  const result = await db.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        match_percentage: { type: "number" },
        reasoning: { type: "string" },
        is_likely_match: { type: "boolean" },
      },
    },
  });
  return result;
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}