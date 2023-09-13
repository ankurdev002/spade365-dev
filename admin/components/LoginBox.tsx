import React, { useState, useEffect, useRef } from "react";
import useInput from "../hooks/useInput";
import Input from "./Input";
import LoaderBG from "./LoaderBG";
import Logo from "./Logo";
import { z } from "zod";
import { toast } from "react-toastify";
import useAuth from "../hooks/useAuth";

export enum Action {
  LOGIN = "login",
  SIGN_UP = "sign up",
  FORGOT_PASSWORD = "login",
}

const LoginBox = () => {
  const { reset: setUsername, ...username } = useInput("");
  const { reset: setPassword, ...password } = useInput("");
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();

  // after 2 seconds, setIsVisible to true
  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => {
      setIsVisible(false);
    }
  }, []);

  // form handlers
  const loginZ = z.object({
    username: z
      .string({ required_error: "Username is required" })
      .min(5, "Username must be atleast 5 characters"),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Passord must be at least 8 characters"),
  });

  // login handler
  const loginHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = loginZ.safeParse({
        username: username.value,
        password: password.value,
      });

      if (!data.success) {
        // setError(data.error.issues[0].message);
        toast.error(data.error.issues[0].message);
        return;
      }
      await auth.login(data.data);
    } catch (err: any) {
      console.log(err);
      // setError(err.message);
    }
  };

  // open whatsapp when btn is clicked
  const openWhatsapp = () => { };

  return (
    <>
      {isVisible &&
        <LoaderBG showLogo={false}>
          <div className="fixed inset-0 overflow-y-auto z-10">
            <div className="flex items-center justify-center min-h-full">

              <div className="bg-primary shadow-lg p-8 rounded-lg w-[90vw] max-w-[500px] scrollbar overflow-auto pb-10 lg:px-15 px-4 lg:px-12">

                {/* logo */}
                <div className="">
                  <div className="pt-8 pb-6">
                    <Logo />
                  </div>
                </div>

                {/* login */}
                <div className="">
                  {error && (
                    <p className="bg-white bg-opacity-10 text-white border-l-4 border-l-red-500 rounded-lg py-5 px-3 text-left mb-2">
                      {error}
                    </p>
                  )}
                  <form onSubmit={loginHandler} className="w-full">
                    {/* phone number/id */}
                    <div className="h-14 relative group border-b-2 border-b-secondary focus-within:border-white">
                      {/* input container */}
                      <div className="absolute inset-0 w-full grid grid-cols-[1fr,max-content]">
                        <input
                          id="username"
                          className={`block border-0 focus:ring-0 outline-none bg-transparent w-full text-white placeholder-white/50`}
                          type="text"
                          placeholder={"Enter Username"}
                          {...username}
                        />
                      </div>
                    </div>

                    {/* password */}
                    <Input
                      type="password"
                      id="password"
                      placeholder="Enter Password"
                      className="mt-5"
                      {...password}
                    />

                    <div className=" mt-8">
                      <button
                        type="submit"
                        className="bg-accent uppercase text-xl text-white w-full h-12 rounded-md shadow-md hover:shadow-lg"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </LoaderBG>
      }
    </>
  );
};

export default LoginBox;
