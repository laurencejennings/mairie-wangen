const trackedPaths = new Set<string>();

function referrerHost() {
  if (!document.referrer) {
    return 'direct';
  }

  try {
    const referrer = new URL(document.referrer);

    if (referrer.hostname === window.location.hostname) {
      return 'internal';
    }

    return referrer.hostname;
  } catch {
    return 'direct';
  }
}

function viewportSize() {
  if (window.innerWidth < 640) {
    return 'mobile';
  }

  if (window.innerWidth < 1024) {
    return 'tablet';
  }

  return 'desktop';
}

export function trackPageView(pathname: string) {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    return;
  }

  const normalizedPath = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  if (trackedPaths.has(normalizedPath)) {
    return;
  }

  trackedPaths.add(normalizedPath);

  const body = JSON.stringify({
    path: normalizedPath,
    referrerHost: referrerHost(),
    viewport: viewportSize(),
    language: navigator.language || 'unknown',
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/page-view', blob);
    return;
  }

  void fetch('/api/analytics/page-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  });
}
