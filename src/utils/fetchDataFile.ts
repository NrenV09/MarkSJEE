/**
 * Utility to resolve and fetch static question packs reliably across all deployment environments,
 * including GitHub Pages subpaths (e.g. https://<user>.github.io/<repo>/), Vite preview, and custom domains.
 */

export function getDataFileCandidates(filename: string): string[] {
  const justFile = filename.split('/').pop() || filename;
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;

  const candidates: string[] = [
    `${cleanBase}data/${justFile}`,
    `./data/${justFile}`,
    `data/${justFile}`,
  ];

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Remove trailing page filename (e.g. index.html) if present
    const pathname = window.location.pathname.replace(/\/[^/]*\.[^/]+$/, '').replace(/\/+$/, '');

    if (pathname) {
      candidates.push(`${origin}${pathname}/data/${justFile}`);
    }

    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0 && !segments[0].includes('.')) {
      candidates.push(`${origin}/${segments[0]}/data/${justFile}`);
    }

    candidates.push(`${origin}/data/${justFile}`);
  }

  candidates.push(`/data/${justFile}`);

  // Deduplicate preserving candidate priority order
  return Array.from(new Set(candidates));
}

export async function fetchJsonData<T = any>(filename: string): Promise<T> {
  const urls = getDataFileCandidates(filename);
  let lastStatus = 404;
  let lastStatusText = 'Not Found';
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json as T;
      }
      lastStatus = res.status;
      lastStatusText = res.statusText || 'Not Found';
    } catch (e: any) {
      lastError = e;
    }
  }

  throw new Error(
    lastError?.message || `Failed to load ${filename} (${lastStatus} ${lastStatusText})`
  );
}
