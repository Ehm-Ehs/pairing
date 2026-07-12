import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/sign-up", "/forgot-password"],
      disallow: ["/api/", "/event/", "/home", "/your-pairing", "/result", "/settings", "/share", "/notifications"],
    },
    sitemap: "https://pair-form.com/sitemap.xml",
  };
}
