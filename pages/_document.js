import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="google-site-verification" content="OIEV3EDpdn2YRYC7LCd-4MpV81ylOyQW2tF47P7CPQ8" />
        <meta name="description" content="DawnDream — A vampire RPG system in Second Life. Explore bloodlines, clans, houses, hordes and community lore." />
        <meta name="keywords" content="DawnDream, vampire RPG, Second Life, vampire system, bloodlines, clans, hordes" />
        <meta property="og:title" content="DawnDream — Vampire RPG System" />
        <meta property="og:description" content="A vampire RPG system in Second Life. Explore bloodlines, clans, houses and community lore." />
        <meta property="og:url" content="https://dawndreamsl.com" />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
