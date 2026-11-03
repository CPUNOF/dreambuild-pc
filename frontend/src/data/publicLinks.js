const publicSite =
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://dreambuild-pc.vercel.app";
export const publicBuildUrl = (id) =>
  new URL(`/ranking/${encodeURIComponent(id)}`, publicSite).href;
