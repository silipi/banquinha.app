// Storefront URLs live here, so changing the URL format only touches this file.
// Stores live at the root: vendeu.store/<handle>. The API reserves every platform path.

import { brandDomain } from '@/lib/site';

export function storePath(handle: string) {
  return `/${handle}`;
}

/** Store address as people read and type it, e.g. "vendeu.store/luluca". */
export function storeDisplayUrl(handle: string) {
  return `${brandDomain}${storePath(handle)}`;
}

export function productPath(handle: string, slug: string) {
  return `${storePath(handle)}/produto/${slug}`;
}

export function bagPath(handle: string) {
  return `${storePath(handle)}/sacola`;
}

/** wa.me link that opens a chat with the store, optionally with a prefilled message. */
export function whatsappLink(phone: string, message?: string) {
  const url = `https://wa.me/${phone}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export function instagramLink(username: string) {
  return `https://instagram.com/${username}`;
}
