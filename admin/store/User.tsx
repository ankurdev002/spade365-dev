import axios from "axios";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/router";
import { createContext, ReactElement, useEffect, useState } from "react";
import { User } from "../pages/users";

type Store = {
  isLoggedIn: boolean;
  token?: string;
  user?: User;
  logout: () => void;
  login: (value: Login) => void;
};

type Login = Omit<Store, "logout" | "login" | "isLoggedIn" | "user">;

export const UserStore = createContext<Store>({
  isLoggedIn: false,
  token: "",
  logout: () => { },
  login: () => { },
});

export default function UserStoreProvider({
  children,
}: {
  children: ReactElement;
}) {
  const [token, setToken] = useState<string>();
  const [user, setUser] = useState<User>();
  const router = useRouter();

  async function fetchProfile() {
    if (!token) return;
    await axios({
      method: "GET",
      url: `/api/team/profile/`,
      // headers: {
      //   "x-access-token": token,
      // },
    })
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.log(err.response);
        if (err.response.status === 401 || err.response.status === 400) logout(); // fix for when token is expired or invalid
      });
  }

  const logout = () => {
    setToken(undefined);
    deleteCookie("token");
    localStorage.removeItem("token"); // httpOnly cookies are already stored by the server in browser which are more secure. Should be used instead of localStorage
    router.push("/");
  };

  const login = (value: Login) => {
    if (!value.token) return;
    setToken(value.token);
    localStorage.setItem("token", value.token);
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  // load data from localstorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    login({ token });
  }, []);

  const value: Store = {
    isLoggedIn: !!token,
    user,
    token,
    logout,
    login,
  };

  return <UserStore.Provider value={value}>{children}</UserStore.Provider>;
}
