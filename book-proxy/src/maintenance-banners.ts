export type BannerTone = 'info' | 'muted' | 'warning' | 'danger';

export type BannerConfig = {
  title: string;
  body: string;
  tone: BannerTone;
};

export const MAINTENANCE_BANNERS: Record<string, BannerConfig> = {
  wip: {
    title: 'Work in Progress',
    body: 'This article or section is a work in progress. Discuss changes on the talk page or with assigned editors.',
    tone: 'info',
  },
  stub: {
    title: 'Stub',
    body: 'This article is a stub. You can help by expanding it.',
    tone: 'muted',
  },
  incomplete: {
    title: 'Incomplete',
    body: 'This page is missing notable sections. You can help by expanding it.',
    tone: 'warning',
  },
  outdated: {
    title: 'Outdated',
    body: 'This page is out of date. You can help by updating it.',
    tone: 'warning',
  },
  'needs-cleanup': {
    title: 'Needs cleanup',
    body: 'This page is factually questionable or poorly written and needs revision.',
    tone: 'warning',
  },
  'needs-formatting': {
    title: 'Needs formatting',
    body: 'The presentation of the information on this page needs improvement.',
    tone: 'warning',
  },
  'needs-images': {
    title: 'Needs images',
    body: 'This page would benefit from sprites or screenshots.',
    tone: 'info',
  },
  split: {
    title: 'Split suggested',
    body: 'This page covers too much content and should be split into separate pages.',
    tone: 'info',
  },
  merge: {
    title: 'Merge suggested',
    body: 'This page should be merged with another page.',
    tone: 'info',
  },
  'replace-image': {
    title: 'Replace image',
    body: 'An image on this page is outdated or low quality and should be replaced.',
    tone: 'warning',
  },
  'slated-removal': {
    title: 'Slated for removal',
    body: 'Upon review, this article will either be deleted or this notice will be removed.',
    tone: 'danger',
  },
  'missing-license': {
    title: 'Missing license',
    body: 'A file on this page was uploaded without licensing information. Please add attribution.',
    tone: 'danger',
  },
};

export const MAINTENANCE_TAG_ORDER = Object.keys(MAINTENANCE_BANNERS);

export function matchingMaintenanceTags(tags: string[]): string[] {
  const normalized = new Set(tags.map((tag) => tag.toLowerCase()));
  return MAINTENANCE_TAG_ORDER.filter((tag) => normalized.has(tag));
}

export function escapeMaintenanceHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function extractMaintenanceReason(html: string): string {
  const match = html.match(
    /<div[^>]*class="[^"]*\bwiki-maintenance-reason\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (!match) return '';
  return match[1].replace(/<[^>]+>/g, '').trim();
}

export function renderMaintenanceBannersHtml(tags: string[], reason = ''): string {
  const matched = matchingMaintenanceTags(tags);
  if (matched.length === 0) return '';

  const reasonText = reason.trim();
  const banners = matched
    .map((tag) => {
      const config = MAINTENANCE_BANNERS[tag];
      const reasonHtml = reasonText
        ? `<p class="wiki-maintenance-banner__reason"><strong>Reason:</strong> ${escapeMaintenanceHtml(reasonText)}</p>`
        : '';

      return (
        `<aside class="wiki-maintenance-banner wiki-maintenance-banner--${tag}" data-tone="${config.tone}">` +
        `<p class="wiki-maintenance-banner__title">${escapeMaintenanceHtml(config.title)}</p>` +
        `<p class="wiki-maintenance-banner__body">${escapeMaintenanceHtml(config.body)}</p>` +
        reasonHtml +
        '</aside>'
      );
    })
    .join('');

  return `<div class="wiki-maintenance-banners" role="status" aria-live="polite">${banners}</div>`;
}

export function buildMaintenanceBannerClientScript(): string {
  const bannersJson = JSON.stringify(MAINTENANCE_BANNERS);
  const tagOrderJson = JSON.stringify(MAINTENANCE_TAG_ORDER);

  return `(function maintenanceBanners() {
  'use strict';

  const BANNERS = ${bannersJson};
  const TAG_ORDER = ${tagOrderJson};
  const ADMIN_PATH = /^\\/a(\\/|$)/;
  let activePath = '';
  let refreshTimer = 0;
  let observer = null;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parsePageLocation() {
    const path = window.location.pathname.replace(/\\/+$/, '') || '/';
    if (ADMIN_PATH.test(path)) return null;

    const match = path.match(/^\\/([a-z]{2})\\/(.+)$/i);
    if (!match) return null;

    return {
      locale: match[1].toLowerCase(),
      path: decodeURIComponent(match[2]),
    };
  }

  function findContentRoot() {
    return (
      document.querySelector('.contents') ||
      document.querySelector('.page-contents') ||
      document.querySelector('.page-content') ||
      document.querySelector('article .markdown-body') ||
      document.querySelector('article')
    );
  }

  function findReason(contentRoot) {
    const reasonEl = contentRoot.querySelector('.wiki-maintenance-reason');
    return reasonEl ? reasonEl.textContent.trim() : '';
  }

  async function fetchTags(locale, path) {
    const query = \`
      query PageTags($path: String!, $locale: String!) {
        pages {
          singleByPath(path: $path, locale: $locale) {
            tags { tag }
          }
        }
      }
    \`;

    const response = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        query,
        variables: { path, locale },
      }),
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const tags = payload?.data?.pages?.singleByPath?.tags;
    if (!Array.isArray(tags)) return null;

    return tags.map((entry) => String(entry.tag).toLowerCase());
  }

  function removeBanners() {
    document.querySelectorAll('.wiki-maintenance-banners').forEach((node) => node.remove());
  }

  function renderBanners(contentRoot, tags, reason) {
    removeBanners();

    const matched = TAG_ORDER.filter((tag) => tags.includes(tag));
    if (matched.length === 0) return;

    const wrap = document.createElement('div');
    wrap.className = 'wiki-maintenance-banners';
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-live', 'polite');

    for (const tag of matched) {
      const config = BANNERS[tag];
      const banner = document.createElement('aside');
      banner.className = 'wiki-maintenance-banner wiki-maintenance-banner--' + tag;
      banner.dataset.tone = config.tone;
      banner.innerHTML =
        '<p class="wiki-maintenance-banner__title">' + escapeHtml(config.title) + '</p>' +
        '<p class="wiki-maintenance-banner__body">' + escapeHtml(config.body) + '</p>' +
        (reason
          ? '<p class="wiki-maintenance-banner__reason"><strong>Reason:</strong> ' + escapeHtml(reason) + '</p>'
          : '');

      wrap.appendChild(banner);
    }

    contentRoot.insertBefore(wrap, contentRoot.firstChild);
  }

  async function refresh() {
    const locationInfo = parsePageLocation();
    const contentRoot = findContentRoot();

    if (!locationInfo || !contentRoot) {
      removeBanners();
      return;
    }

    const routeKey = locationInfo.locale + '/' + locationInfo.path;
    if (routeKey === activePath && contentRoot.querySelector('.wiki-maintenance-banners')) {
      return;
    }

    activePath = routeKey;

    try {
      const tags = await fetchTags(locationInfo.locale, locationInfo.path);
      if (!tags) {
        removeBanners();
        return;
      }

      const reason = findReason(contentRoot);
      renderBanners(contentRoot, tags, reason);
    } catch (error) {
      console.warn('[maintenance-banners]', error);
    }
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refresh, 120);
  }

  function watchContent() {
    if (observer) observer.disconnect();

    const target = document.querySelector('#app') || document.body;
    observer = new MutationObserver(scheduleRefresh);
    observer.observe(target, { childList: true, subtree: true });
  }

  function boot() {
    watchContent();
    scheduleRefresh();
    window.addEventListener('popstate', scheduleRefresh);
    window.addEventListener('hashchange', scheduleRefresh);

    const originalPushState = history.pushState;
    history.pushState = function pushStatePatched() {
      const result = originalPushState.apply(this, arguments);
      scheduleRefresh();
      return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function replaceStatePatched() {
      const result = originalReplaceState.apply(this, arguments);
      scheduleRefresh();
      return result;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();`;
}
