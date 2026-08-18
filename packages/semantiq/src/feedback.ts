export interface PublicFeedbackItem {
  readonly id: string;
  readonly category:
    | "bug-report"
    | "benchmark-request"
    | "connector-request"
    | "reproducibility-issue"
    | "documentation-improvement"
    | "feature-proposal";
  readonly title: string;
  readonly description: string;
  readonly submitterRole?: string;
  readonly createdAt: string;
  readonly status: "new" | "triaged" | "in-review" | "resolved" | "deferred";
}

export interface FeedbackSynthesisSummary {
  readonly totalItems: number;
  readonly categories: Readonly<Record<string, number>>;
  readonly topActionItems: readonly string[];
}

export function submitPublicFeedback(
  category: PublicFeedbackItem["category"],
  title: string,
  description: string
): PublicFeedbackItem {
  return {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category,
    title: title.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
    status: "new"
  };
}

export function synthesizeFeedback(items: readonly PublicFeedbackItem[]): FeedbackSynthesisSummary {
  const categories: Record<string, number> = {};
  for (const item of items) {
    categories[item.category] = (categories[item.category] ?? 0) + 1;
  }
  const topActionItems = items
    .filter((item) => item.category === "bug-report" || item.category === "reproducibility-issue")
    .map((item) => `[${item.category.toUpperCase()}] ${item.title}`);

  return {
    totalItems: items.length,
    categories,
    topActionItems
  };
}

export function generateDecisionRecord(pdrNumber: number, title: string, decision: string): string {
  const numStr = String(pdrNumber).padStart(3, "0");
  return `# Product Decision Record PDR-${numStr}: ${title}

## Status
ACCEPTED

## Context
Community feedback collected during Public Alpha testing.

## Decision
${decision}
`;
}
