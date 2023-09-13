import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import SiteContextProvider from "../store/Site";
import "react-toastify/dist/ReactToastify.css";
import "animate.css/animate.min.css";
import "../styles/style.scss"; // Import stylesheet
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { GoogleAnalytics } from "nextjs-google-analytics";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  // style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

  // Facebook Pixel
  useEffect(() => {
    if (!FB_PIXEL_ID) return;
    import('react-facebook-pixel')
      .then((x) => x.default)
      .then((ReactPixel) => {
        ReactPixel.init(FB_PIXEL_ID) // facebookPixelId
        ReactPixel.pageView()

        router.events.on('routeChangeComplete', () => {
          ReactPixel.pageView()
        })
      })
  }, [router.events])

  return (
    <>
      <Head>
        <meta name='theme-color' content='#235789' />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Head>
      <SiteContextProvider>
        <GoogleAnalytics trackPageViews />
        <main className={`${poppins.variable} font-sans`}>
          <Component {...pageProps} />
        </main>
      </SiteContextProvider>
    </>
  );
}
