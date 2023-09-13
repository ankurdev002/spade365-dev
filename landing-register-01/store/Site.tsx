// this context saves the site context
// i.e colors, text, images etc...

import axios from "axios";
import { ReactNode, createContext, useEffect, useState } from "react";

type Banner = {
  image: string;
  redirect: string;
  page: string;
};

type Colors = {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
};

type Notices = {
  loggedIn: Logged;
  loggedOut: Logged;
};

type Logged = {
  text: string;
};

type Site = {
  banners: Banner[];
  colors: Colors;
  notices: Notices;
  whatsapp_number?: string;
};

const defaultSite: Site = {
  banners: [],
  colors: {
    primary: "",
    secondary: "",
    accent: "",
    neutral: "",
  },
  notices: {
    loggedIn: { text: "" },
    loggedOut: { text: "" },
  },
};

export const SiteContext = createContext<Site>(defaultSite);

export default function SiteContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [context, setContext] = useState<Site>(defaultSite);

  async function fetchContext() {
    await axios({
      method: "GET",
      url: `/api/site/`,
    })
      .then((res) => {
        setContext(res.data);
        // set colors as css variables
        Object.keys((res.data as Site).colors).map((color) => {
          document.documentElement.style.setProperty(
            `--${color}`,
            res.data.colors[color]
          );
        });
      })
      .catch((err) => {
        console.log(err.response);
      });
  }

  useEffect(() => {
    fetchContext();
  }, []);

  return (
    <SiteContext.Provider value={context}>{children}</SiteContext.Provider>
  );
}
