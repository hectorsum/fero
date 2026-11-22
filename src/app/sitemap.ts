import type { MetadataRoute } from "next";
import { siteUrl } from "@/infrastructure/config/shop";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
