import { Dialog } from "@headlessui/react";
import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown, FiUser, FiX } from "react-icons/fi";
import { MdPhoneAndroid } from "react-icons/md";
import useInput from "../hooks/useInput";
import Input from "./Input";
import LoaderBG from "./LoaderBG";
import Logo from "./Logo";
import { z } from "zod";
import { toast } from "react-toastify";
import useAuth from "../hooks/useAuth";
import useSiteContext from "../hooks/useSiteContext";

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  openModal?: () => void;
  active: Action;
};

export enum Action {
  LOGIN = "login",
  SIGN_UP = "sign up",
  FORGOT_PASSWORD = "forgot password",
}

enum SignInMethod {
  MOBILE_NUMBER = "mobile number",
  ID = "id",
}

const LoginModal = (props: Props) => {
  const { isOpen, closeModal, active: propsActive } = props;
  const [active, setActive] = useState(propsActive);
  const { reset: setMobile, ...mobile } = useInput("");
  const { reset: setPassword, ...password } = useInput("");
  const { reset: setConfirmPassword, ...confirmPassword } = useInput("");
  const { reset: setOtp, ...otp } = useInput("");
  const [signInMethod, setSignInMethod] = useState(SignInMethod.MOBILE_NUMBER);
  const [signInMethodOpen, setSignInMethodOpen] = useState(false);
  const [error, setError] = useState("");
  const [otpLife, setOtpLife] = useState(0);
  const timerRef = useRef<HTMLParagraphElement>(null);
  const auth = useAuth();
  const site = useSiteContext();

  useEffect(() => {
    setMobile("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setSignInMethod(SignInMethod.MOBILE_NUMBER);
    setSignInMethodOpen(false);
    setError("");
    setOtpLife(0);
  }, [active]);

  // otp countdown
  useEffect(() => {
    if (otpLife <= 0) return;
    const interval = setInterval(() => {
      if (otpLife <= 0) {
        console.log("clear interval");
        clearInterval(interval);
        return;
      }

      if (timerRef != null && timerRef.current != null) {
        timerRef.current.innerHTML = `${otpLife} secs`;
      }
      setOtpLife(otpLife - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpLife]);

  const updateActive = (value: Action) => {
    setActive(value);
  };

  // form handlers

  const loginZ = z.object({
    phoneNumber: z
      .string({ required_error: "Phone number is required" })
      .length(10, "Incorrect phone number"),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Passord must be at least 8 characters"),
  });

  // login handler
  const loginHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = loginZ.safeParse({
        phoneNumber: mobile.value,
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

  const signUp = z
    .object({
      phoneNumber: z
        .string({ required_error: "Phone number is required" })
        .length(10, "Incorrect phone number"),
      otp: z
        .string({ required_error: "OTP is required" })
        .length(4, "Invalid OTP"),
      password: z
        .string({ required_error: "Password is required" })
        .min(8, "Passord must be at least 8 characters"),
      confirmPassword: z
        .string({ required_error: "Confirm pasword is required" })
        .min(8, "Confirm passord must be at least 8 characters"),
    })
    .superRefine((data, ctx) => {
      if (data.confirmPassword !== data.password) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
        });
      }
    });

  // sign up handler
  const signUpHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = signUp.safeParse({
        phoneNumber: mobile.value,
        otp: otp.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      });

      if (!data.success) {
        // setError(data.error.issues[0].message);
        toast.error(data.error.issues[0].message);
        return;
      }

      await auth.signup(data.data).then((res) => {
        setActive(Action.LOGIN);
      });
    } catch (err: any) {
      toast.error(err.message);
      // setError(err.message);
    }
  };

  const forgotPasswordHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = signUp.safeParse({
        phoneNumber: mobile.value,
        otp: otp.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
      });

      if (!data.success) {
        toast.error(data.error.issues[0].message);
        return;
      }

      await auth
        .changePassword(data.data)
        .then((res) => setActive(Action.LOGIN));
    } catch (err: any) {
      toast.error(err.message);
      // setError(err.message);
    }
  };

  // send otp to mobile number
  // TODO: dont save OTP in production
  const getOtp = async () => {
    if (otpLife > 0) return;
    if (!mobile.value || mobile.value.length < 10) {
      setError("Invalid mobile number");
      return;
    }

    await auth
      .getOtp(mobile.value)
      .then((res) => {
        // setOtp((res as unknown as { otp: string; otpLife: number }).otp);
        toast.success("OTP sent");
        setOtpLife(
          (res as unknown as { otp: string; otpLife: number }).otpLife
        );
      })
      .catch((e) => { });
  };

  // open whatsapp when btn is clicked
  const openWhatsapp = () => {
    window.open(
      `https://wa.me/${site.whatsapp_number}?text=Hi%20I%20want%20to%20get%20new%20ID`,
      "_blank"
    );
  };

  return (
    <Dialog onClose={closeModal} open={isOpen}>
      <Dialog.Backdrop className="fixed inset-0 backdrop-blur" />
      <LoaderBG showLogo={false}>
        <div className="animate__animated animate__fadeInUp fixed inset-0 overflow-y-auto z-10">
          <div className="flex items-center justify-center min-h-full">
            {/* w-[90vw] max-w-[500px] */}
            <Dialog.Panel className="bg-primary pt-0 px-0 rounded-xl overflow-hidden grid grid-rows-[max-content,1fr] w-[90vw] max-w-[500px] 3xl:max-w-2xl md:min-h-fit md:max-h-[90vh]">
              {/* action header */}
              <header className="relative grid grid-cols-2 text-xl">
                <button
                  className={`h-14 ${active === Action.SIGN_UP
                    ? "text-white"
                    : "bg-secondary text-black"
                    }`}
                  onClick={() => updateActive(Action.SIGN_UP)}
                >
                  Signup
                </button>
                <button
                  className={`h-14 ${active === Action.LOGIN || active === Action.FORGOT_PASSWORD
                    ? "text-white"
                    : "bg-secondary text-black shadow-inner"
                    }`}
                  onClick={() => updateActive(Action.LOGIN)}
                >
                  Login
                </button>

                {/* close forgot password section */}
                {active === Action.FORGOT_PASSWORD && (
                  <button
                    className="absolute right-10 top-1/2 -translate-y-1/2 -translate-x-1/2"
                    onClick={() => updateActive(Action.LOGIN)}
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                )}
              </header>

              <div className="scrollbar overflow-auto pb-10  lg:px-15 px-4 lg:px-12">
                {/* close btn */}
                <button
                  className="text-white absolute right-10 top-7 md:hidden"
                  onClick={closeModal}
                >
                  <FiX className="h-6 w-6" />
                </button>

                {/* logo */}
                <div className="">
                  <div className="pt-8 pb-6">
                    <Logo />
                  </div>
                </div>

                {/* login - signup */}
                <div className="">
                  {error && (
                    <p className="bg-white bg-opacity-10 text-white border-l-4 border-l-red-500 rounded-lg py-5 px-3 text-left mb-2">
                      {error}
                    </p>
                  )}
                  {active === Action.LOGIN ? (
                    <form onSubmit={loginHandler} className="w-full">
                      {/* phone number/id */}
                      <div className="h-14 relative group border-b-2 border-b-secondary focus-within:border-white text-base">
                        {/* prefix */}
                        {signInMethod === SignInMethod.MOBILE_NUMBER && (
                          <div className="absolute left-0 bottom-0 w-12 h-full grid place-items-center text-white">
                            +91
                          </div>
                        )}
                        {/* input container */}
                        <div className="absolute inset-0 w-full grid grid-cols-[1fr,max-content]">
                          <input
                            id="mobile"
                            className={`block border-0 focus:ring-0 outline-none bg-transparent w-full text-white placeholder-white/50 ${signInMethod === SignInMethod.MOBILE_NUMBER
                              ? "pl-12"
                              : ""
                              }`}
                            type="number"
                            autoComplete="new-phone"
                            placeholder={
                              signInMethod === SignInMethod.MOBILE_NUMBER
                                ? "10 Digit Phone number"
                                : "ID"
                            }
                            {...mobile}
                          />
                          {/* input type selector */}
                          {/* <div className="min-w-12 h-full grid place-items-center absolute right-0"> */}
                          <div className="min-w-12 h-full hidden place-items-center absolute right-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSignInMethodOpen((s) => !s);
                              }}
                              className={`grid gap-2 place-items-center border-2 bg-primary border-secondary rounded-md  ${signInMethodOpen
                                ? "bg-primary z-10"
                                : "grid-cols-2 py-1 px-4"
                                }`}
                            >
                              {!signInMethodOpen ? (
                                <>
                                  {signInMethod ===
                                    SignInMethod.MOBILE_NUMBER ? (
                                    <MdPhoneAndroid className="text-secondary w-6 h-6" />
                                  ) : (
                                    <FiUser className="text-secondary w-6 h-6" />
                                  )}
                                  <FiChevronDown className="text-secondary w-6 h-6" />
                                </>
                              ) : (
                                <>
                                  <div
                                    onClick={() => {
                                      setSignInMethod(
                                        SignInMethod.MOBILE_NUMBER
                                      );
                                    }}
                                    className="grid grid-cols-[max-content,1fr] place-content-center gap-6 px-6 h-10"
                                  >
                                    <MdPhoneAndroid className="text-secondary w-6 h-6" />
                                    <p className="text-white">Mobile number</p>
                                  </div>
                                  <div
                                    onClick={() => {
                                      setSignInMethod(SignInMethod.ID);
                                    }}
                                    className="grid grid-cols-[max-content,1fr] place-content-center gap-6 px-6 h-10 border-t-2 border-secondary w-full"
                                  >
                                    <FiUser className="text-secondary w-6 h-6" />
                                    <p className="place-self-start text-white">
                                      ID
                                    </p>
                                  </div>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* password */}
                      <Input
                        type="password"
                        id="password"
                        placeholder="Password"
                        className="mt-5"
                        {...password}
                      />

                      {/* forgot password */}
                      <div className="text-right">
                        <button
                          type="button"
                          className="underline mt-4 text-white"
                          onClick={() => setActive(Action.FORGOT_PASSWORD)}
                        >
                          Forgot password?
                        </button>
                      </div>

                      <div className=" mt-8">
                        <button
                          type="submit"
                          className="bg-accent uppercase text-xl text-white w-full h-12 rounded-md shadow-md hover:shadow-lg"
                        >
                          Login
                        </button>
                      </div>
                    </form>
                  ) : active === Action.SIGN_UP ? (
                    <form onSubmit={signUpHandler}>
                      {/* phone number/id */}
                      <Input
                        prefix="+91"
                        type="number"
                        id="mobile"
                        placeholder="10 Digit phone number"
                        maxLength={10}
                        {...mobile}
                      />

                      {/* otp button */}
                      <div className="flex items-center justify-end mt-4">
                        {otpLife > 0 && (
                          <div className="mr-5 font-light">
                            Try again in{" "}
                            <p
                              className="inline-block font-bold"
                              ref={timerRef}
                            ></p>
                          </div>
                        )}
                        <button
                          type="button"
                          className="bg-secondary text-black rounded-full px-2 py-[2px] font-medium ml-full"
                          onClick={getOtp}
                        >
                          Get OTP
                        </button>
                      </div>

                      {/* otp */}
                      <Input
                        type="number"
                        id="otp"
                        placeholder="OTP"
                        {...otp}
                      />

                      {/* password */}
                      <Input
                        type="password"
                        id="password"
                        placeholder="Password"
                        className="mt-5"
                        {...password}
                      />

                      {/* confirm password */}
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm Password"
                        className="mt-5"
                        {...confirmPassword}
                      />

                      <button
                        type="submit"
                        className="bg-accent uppercase text-xl text-white w-full h-12 rounded-md shadow-md hover:shadow-lg mt-8"
                      >
                        SIGNUP
                      </button>

                      <p className="mx-auto text-center mt-6 text-white">
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => updateActive(Action.LOGIN)}
                        >
                          Log in
                        </button>
                      </p>

                      {/* divider */}
                      <div className="relative h-14 flex items-center justify-center text-white">
                        <div className="w-full h-[2px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-white to-transparent" />
                        <p className="h-14 px-6 grid place-items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary">
                          OR
                        </p>
                      </div>

                      {/* whatsapp */}
                      <button
                        type="button"
                        className="underline text-center mx-auto block text-white"
                        onClick={openWhatsapp}
                      >
                        Get your ready-made ID from WhatsApp
                      </button>

                      <button
                        type="button"
                        className="uppercase block text-base text-center mx-auto bg-white text-black px-4 py-2 rounded-lg mt-5"
                        onClick={openWhatsapp}
                      >
                        WhatsApp now
                      </button>
                    </form>
                  ) : active === Action.FORGOT_PASSWORD ? (
                    <form onSubmit={forgotPasswordHandler} className="w-full">
                      {/* phone number/id */}
                      <Input
                        prefix="+91"
                        type="number"
                        id="mobile"
                        placeholder="10 Digit phone number"
                        maxLength={10}
                        {...mobile}
                      />

                      {/* otp button */}
                      <div className="flex items-center justify-end mt-4">
                        {otpLife > 0 && (
                          <div className="mr-5 font-light">
                            try again in{" "}
                            <p
                              className="inline-block font-bold"
                              ref={timerRef}
                            ></p>
                          </div>
                        )}
                        <button
                          type="button"
                          className="bg-secondary text-black rounded-full px-2 py-[2px] font-medium ml-full"
                          onClick={getOtp}
                        >
                          Get OTP
                        </button>
                      </div>

                      {/* otp */}
                      <Input
                        type="number"
                        id="otp"
                        placeholder="OTP"
                        {...otp}
                      />

                      {/* password */}
                      <Input
                        type="password"
                        id="password"
                        placeholder="Password"
                        className="mt-5"
                        {...password}
                      />

                      {/* confirm password */}
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm Password"
                        className="mt-5"
                        {...confirmPassword}
                      />

                      <div className=" mt-8">
                        <button
                          type="submit"
                          className="bg-accent uppercase text-xl text-white w-full h-12 rounded-md shadow-md hover:shadow-lg"
                        >
                          Change password
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </LoaderBG>
    </Dialog>
  );
};

export default LoginModal;
