"use client";

import Script from "next/script";

const Clarity = () => {
  const isDevelopEnv = () => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (
        host.includes("develop") ||
        host.includes("localhost")
      ) {
        return true;
      }
    }
    return process.env.NEXT_PUBLIC_APP_ENV === "develop" || process.env.NODE_ENV === "development";
  };

  const isDev = isDevelopEnv();
  const clarityId = (isDev && process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_DEVELOP_ID)
    ? process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_DEVELOP_ID
    : process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID;

  if (!clarityId) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `,
      }}
    />
  );
};

export default Clarity;
