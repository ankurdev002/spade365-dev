import type { AppProps } from "next/app";
import Layout from "../components/Layout";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import 'react-toastify/dist/ReactToastify.css';
import "../styles/style.scss"; // Import stylesheet
import { Poppins } from "next/font/google";
import MenuStoreProvider from "../store/Menu";
import UserStoreProvider from "../store/User";
import axios from "axios";
import Head from "next/head";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  // style: ["normal"],
  subsets: ["latin"],
  display: 'swap'
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name='theme-color' content='#000000' />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Head>
      <MenuStoreProvider>
        <UserStoreProvider>
          <main className={`${poppins.variable} font-sans`}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </main>
        </UserStoreProvider>
      </MenuStoreProvider>
    </>
  );
}
