// Storefront URLs live here so moving stores to <handle>.vendeu.store only changes this file.

export function storePath(handle: string) {
  return `/loja/${handle}`;
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
