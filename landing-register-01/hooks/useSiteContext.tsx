import { SiteContext } from "../store/Site";
import { useContext } from "react";

export default function useSiteContext() {
  const context = useContext(SiteContext);

  return { ...context };
}
