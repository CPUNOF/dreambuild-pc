const publicSite =
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://dreambuild-pc.vercel.app";
export const publicBuildUrl = (id) =>
  new URL(`/ranking/${encodeURIComponent(id)}`, publicSite).href;
export function publicBattleUrl(params, a, b) {
  const url = new URL("/combate", publicSite);
  for (const key of ["a", "b", "res", "jogo", "publico", "prioridade"])
    if (params.get(key)) url.searchParams.set(key, params.get(key));
  url.searchParams.set("a", a);
  url.searchParams.set("b", b);
  return url.href;
}
