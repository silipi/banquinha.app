// Tagged per store so merchant edits can refresh the storefront (updateTag in app/painel/actions.ts).
export const storeCacheTag = (handle: string) =>
  `store:${handle.toLowerCase()}`;
