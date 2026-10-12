export type SaveResult = "saved" | "declined" | "busy" | "failed";
export type Saver = (filename: string, data: string) => Promise<SaveResult>;

interface ArtifactDownloads {
  save(req: { filename: string; data: string }): Promise<unknown>;
}
interface ArtifactRuntime {
  use(name: "downloads"): Promise<ArtifactDownloads | null>;
}

/** A plain browser download: what the Vercel site uses. */
const anchorSaver: Saver = async (filename, data) => {
  const url = URL.createObjectURL(new Blob([data], { type: "text/plain;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  // Browsers throttle back-to-back downloads; a short gap keeps "Download all" reliable.
  await new Promise((r) => setTimeout(r, 350));
  return "saved";
};

/**
 * Pick how files are saved. Inside a claude.ai artifact the page cannot start a
 * download itself and must ask the viewer through the `downloads` capability;
 * everywhere else a normal download link works. Resolves to null when saving
 * isn't possible here, so the UI can hide its download buttons.
 */
export async function getSaver(): Promise<Saver | null> {
  const runtime = (window as unknown as { claude?: ArtifactRuntime }).claude;
  if (!runtime?.use) return anchorSaver;
  const downloads = await runtime.use("downloads").catch(() => null);
  if (!downloads) return null;
  return async (filename, data) => {
    try {
      await downloads.save({ filename, data });
      return "saved";
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      return code === "declined" ? "declined" : code === "rate_limited" ? "busy" : "failed";
    }
  };
}
