import { useContext } from "react";
import { UserStore } from "../store/User";

export default function useUser() {
  const store = useContext(UserStore);

  return store;
}
