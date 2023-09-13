import { useContext } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/router";
import { UserStore } from "../store/User";

export default function useAuth() {
  const router = useRouter();
  const { login: loginUser } = useContext(UserStore);

  const login = async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    await axios({
      method: "POST",
      url: `/api/team/login/`,
      data: {
        username,
        password,
      },
    })
      .then((res) => {
        toast.success("Logged in!");
        loginUser({
          token: res.data.token,
        });
        router.replace("/");
      })
      .catch((err) => {
        if (typeof err.response?.data === "string") {
          toast.error(err.response.data);
          return;
        } else if (err.response?.data?.errors) {
          const e = err.response.data.errors[0];
          if (
            (e.msg as string).toLowerCase() === "invalid value" &&
            e.param === "password"
          ) {
            return;
          }
        }
        toast.error(err.message);
      });
  };

  const logout = () => {
    // setUser(null);
    localStorage.removeItem("user");
    deleteCookie("token");
    toast.success("Logged out!");
    router.reload();
  };

  return {
    login,
    logout,
  };
}
