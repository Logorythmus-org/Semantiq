export interface SerializedDocument {
  readonly format: "json" | "yaml" | "markdown" | "binary";
  readonly content: string | Uint8Array;
}

export const serializeJson = (value: unknown): SerializedDocument => ({
  format: "json",
  content: JSON.stringify(value, null, 2)
});

export const serializeMarkdown = (title: string, body: string): SerializedDocument => ({
  format: "markdown",
  content: `# ${title}\n\n${body}`
});

export const snapshot = (value: unknown): SerializedDocument => serializeJson({ createdAt: new Date().toISOString(), value });
