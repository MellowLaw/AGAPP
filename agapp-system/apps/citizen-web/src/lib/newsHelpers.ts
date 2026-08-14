/**
 * Extracts the primary image URL from a Supabase news_announcements item.
 * Admin portal uploads are stored in the `attachments` JSON array.
 */
export function getNewsImageUrl(item: any, fallback?: string): string {
  if (!item) return fallback || '/brand/pagbati-splash.png';

  // 1. Check if direct image_url or banner_url is present
  if (item.image_url) return item.image_url;
  if (item.banner_url) return item.banner_url;

  // 2. Check attachments array from admin portal
  if (Array.isArray(item.attachments) && item.attachments.length > 0) {
    const imageAtt = item.attachments.find(
      (att: any) =>
        (att?.type && att.type.startsWith('image/')) ||
        (att?.url && /\.(jpg|jpeg|png|webp|gif|svg)/i.test(att.url))
    );
    if (imageAtt?.url) return imageAtt.url;
    if (item.attachments[0]?.url) return item.attachments[0].url;
  }

  // 3. Fallback to passed fallback or default brand art
  return fallback || '/brand/pagbati-splash.png';
}

/**
 * Extracts non-image document attachments (e.g. PDF, docx) for download links.
 */
export function getDocumentAttachments(item: any): Array<{ url: string; name: string; type?: string }> {
  if (!item || !Array.isArray(item.attachments)) return [];
  return item.attachments.filter(
    (att: any) =>
      att?.url &&
      !att.type?.startsWith('image/') &&
      !/\.(jpg|jpeg|png|webp|gif|svg)/i.test(att.url)
  );
}

/**
 * Determines whether a news, advisory, or announcement item has expired.
 * 1. Checks explicit `expires_at` timestamp if set.
 * 2. Checks `duration_hours` (e.g. 24 hours, 72 hours / 3 days).
 */
export function isItemExpired(item: any): boolean {
  if (!item) return false;
  const now = Date.now();

  if (item.expires_at) {
    return new Date(item.expires_at).getTime() < now;
  }

  if (item.duration_hours && (item.published_at || item.created_at)) {
    const pubTime = new Date(item.published_at || item.created_at).getTime();
    const expiryTime = pubTime + item.duration_hours * 60 * 60 * 1000;
    return expiryTime < now;
  }

  return false;
}

