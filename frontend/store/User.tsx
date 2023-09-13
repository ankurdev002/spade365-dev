import axios from "axios";
import { useRouter } from "next/router";
import { createContext, ReactElement, useEffect, useState } from "react";
import {
  // setCookie, 
  // getCookie, 
  // hasCookie, 
  deleteCookie
} from "cookies-next";
import { Time } from "../pages/user/time-setting";

type Store = {
  isLoggedIn: boolean;
  token?: string;
  user?: User;
  logout: () => void;
  login: (value: Login) => void;
};

type Login = Omit<Store, "logout" | "login" | "isLoggedIn" | "user">;

// user interface
export interface User {
  username: string;
  id: number; // user id in database
  name?: string;
  email?: string;
  phone: string;
  role?: string;
  credit?: number;
  bonus?: number;
  exposure?: number; // total exposure. Will be mostly saved in negative value, i.e the total amount of money user can lose on all bets.
  exposureTime?: Date; // last exposure time. Required by provider: Fawk Poker
  wagering?: number; //  total wagering/rolling amount of user on all bets.stake. resets on every deposit.
  newPassword?: string; // for setting new password while editing or adding user. Not for fetching user data from API as password field is encrypted and not returned.
  ip?: string;
  user_agent?: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_deleted?: boolean;
  is_banned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastActive?: string;
  timezone: Time;
  access?: {
    // access permissions for admin panel, only for ts type. not useful on frontend.
    dashboard?: boolean;
    users?: boolean;
    team?: boolean;
    games?: boolean;
    deposits?: boolean;
    withdrawals?: boolean;
    bankAccounts?: boolean;
    transactions?: boolean;
    settings?: boolean;
    reports?: boolean;
  };
}

export const UserStore = createContext<Store>({
  isLoggedIn: false,
  token: "",
  logout: () => { },
  login: () => { },
});

export default function UserStoreProvider({ children }: { children: ReactElement }) {
  const [token, setToken] = useState<string>();
  const [user, setUser] = useState<User>();
  const router = useRouter();

  async function fetchProfile() {
    if (!token) return;
    await axios({
      method: "GET",
      url: `/api/users/profile/`,
      // headers: {
      //   "x-access-token": token,
      // },
    })
      .then(async (res) => {
        setUser(res.data);
      })
      .catch((err) => {
        console.log(err.response.status);
        if (err.response.status === 401 || err.response.status === 400) logout(); // fix for when token is expired or invalid
      });
  }

  const logout = () => {
    setToken(undefined);
    localStorage.removeItem("token");
    deleteCookie("token");
    router.push("/");
  };

  const login = (value: Login) => {
    if (!value.token) return;
    setToken(value.token);
    localStorage.setItem("token", value.token);
  };

  useEffect(() => {
    fetchProfile();
    // if is logged in, fetch profile every 10 seconds to refresh user data/balance. Client doesnt want user to refresh after deposit/withdrawal/bets.
    if (token) {
      const interval = setInterval(() => {
        fetchProfile();
      }, 10000);
      return () => clearInterval(interval);
    }
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
