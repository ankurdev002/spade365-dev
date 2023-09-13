import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { BiUser } from "react-icons/bi";
import useSiteContext from "../hooks/useSiteContext";
import { RiHandCoinFill, RiLockPasswordFill } from "react-icons/ri";
import Logo from "../components/Logo";
import { BsFillTelephoneFill, BsGiftFill } from "react-icons/bs";
import { IoIosKeypad } from "react-icons/io";
import { FaCoins } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useState } from "react";
import { ToastContainer } from 'react-toastify';
import SpadeLogo from "../public/spade.png";
// import GameProviderGrid from "../components/GameProviderGrid";

export default function Home() {
  const site = useSiteContext();
  const userData = {
    name: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    otp: "",
  }
  const [user, setUser] = useState(userData);

  // send otp
  const sendOtp = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!user.phoneNumber || user.phoneNumber.length !== 10) {
      toast.error("Please enter a valid mobile number. 10 digits without country code");
      return;
    }
    try {
      await axios({
        method: "GET",
        url: `/api/users/otp?phoneNumber=${user.phoneNumber}`,
      })
        .then((res) => {
          console.log(res.data.otp);
          toast.success("OTP sent successfully");
        })
        .catch((e) => {
          if (e?.response?.data?.timePending) {
            toast.error(`OTP already sent. Please wait ${e.response.data.timePending} minutes before requesting again`);
            return;
          } else {
            toast.error(e.message);
          }
          console.log(e);
        });
    } catch (error) {
      console.log(error);
    }
  };

  // input form
  const signup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user.name) return toast.error("Please enter your name");
    if (user.phoneNumber.length !== 10) return toast.error("Please enter a valid mobile number. 10 digits without country code");
    if (!user.otp) return toast.error("Please enter the OTP sent to your mobile number. Or click on 'Send OTP'");
    if (user.password !== user.confirmPassword) return toast.error("Passwords do not match");
    if (user.password.length < 8) return toast.error("Password must be at least 8 characters");

    try {
      await axios({
        method: "POST",
        url: `/api/users/signup/`,
        data: user,
      })
        .then((res) => {
          toast.success("Account created successfully. You can login now");
          setUser(userData);
          // redirect to https://spade365.com/ after 3 seconds
          setTimeout(() => {
            window.location.href = "https://spade365.com/";
          }, 3000);
        })
        .catch((err) => {
          if (typeof err.response.data === "string") {
            toast.error(err.response.data);
            // setError(err.response.data);
            return;
          } else if (err.response?.data?.errors) {
            const e = err.response.data.errors[0];
            if ((e.msg as string).toLowerCase() === "invalid value" && e.param === "password") {
              toast.error("Your password is not strong");
              return;
            }
          }
          toast.error(err.message);
        });
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <>
      <Head>
        <title>Spade365 | Experience The Thrill Of Online Casino Gaming In India</title>
        <meta
          name="description"
          content="Join Spade365 today and start your winning streak! With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sports-bg flex flex-col items-center justify-center min-h-screen pt-12 pb-40 bg-black overflow-hidden relative">
        {/* black overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-40"></div>
        <div className="flex flex-col items-center justify-start w-full flex-1 px-2 text-center z-10">
          {/* content */}
          <div className="mb-4">
            {/* <Logo size={"5xl"} /> */}
            <Image src={SpadeLogo} alt="Spade365" width={200} height={200} />
          </div>
          {/* signup form with name, mobile, password, confirm password */}
          <form onSubmit={(e) => signup(e)} className="max-w-2xl w-full space-y-2 bg-black/40 rounded-sm shadow-lg px-8 backdrop-blur-md py-4">
            <div>
              <div className="text-base bg-secondary text-black flex flex-row text-left px-2 py-2 max-w-md mx-auto justify-center items-center rounded-sm"><RiHandCoinFill className="mr-2" /> Self deposit and self withdrawal system</div>
            </div>
            <div className="text-white">
              <div className="relative">
                <label htmlFor="name" className="sr-only">
                  Name
                </label>
                <BiUser className="absolute top-2 left-4 w-8 h-8" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="new-name"
                  className="form-input bg-transparent relative block w-full px-3 py-2 my-4 pl-16 text-xl placeholder:text-white/75"
                  placeholder="Name"
                  value={user.name}
                  onChange={(e) => setUser({
                    ...user,
                    name: e.target.value,
                  })}
                />
              </div>
              <div className="relative">
                <label htmlFor="phone" className="sr-only">
                  Phone (10 Digits)
                </label>
                <BsFillTelephoneFill className="absolute top-2 left-4 w-8 h-8" />
                <button
                  onClick={(e) => sendOtp(e)}
                  // disabled={user.phoneNumber ? false : true}
                  className="absolute top-2 right-4 bg-secondary text-black rounded-sm flex flex-row justify-center items-center px-2 py-1 z-10">Send OTP</button>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  autoComplete="new-phone"
                  className="form-input bg-transparent relative block w-full px-3 py-2 my-4 pl-16 text-xl placeholder:text-white/75"
                  placeholder="Phone (10 Digits)"
                  value={user.phoneNumber}
                  onChange={(e) => setUser({
                    ...user,
                    phoneNumber: e.target.value,
                  })}
                />
              </div>
              <div className="relative">
                <label htmlFor="otp" className="sr-only">
                  OTP
                </label>
                <IoIosKeypad className="absolute top-2 left-4 w-8 h-8" />
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  autoComplete="new-otp"
                  className="form-input bg-transparent relative block w-full px-3 py-2 my-4 pl-16 text-xl placeholder:text-white/75"
                  placeholder="OTP"
                  value={user.otp}
                  onChange={(e) => setUser({
                    ...user,
                    otp: e.target.value,
                  })}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <RiLockPasswordFill className="absolute top-2 left-4 w-8 h-8" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className="form-input bg-transparent relative block w-full px-3 py-2 my-4 pl-16 text-xl placeholder:text-white/75"
                  placeholder="Password"
                  value={user.password}
                  onChange={(e) => setUser({
                    ...user,
                    password: e.target.value,
                  })}
                />
              </div>
              <div className="relative">
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <RiLockPasswordFill className="absolute top-2 left-4 w-8 h-8" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="confirm-password"
                  className="form-input bg-transparent relative block w-full px-3 py-2 my-4 pl-16 text-xl placeholder:text-white/75"
                  placeholder="Confirm Password"
                  value={user.confirmPassword}
                  onChange={(e) => setUser({
                    ...user,
                    confirmPassword: e.target.value,
                  })}
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full text-2xl text-white bg-accent py-2 rounded-sm uppercase mt-0 mb-6 font-semibold"
                >
                  Sign up
                </button>
                <Link href="https://spade365.com" target={"_blank"} className="text-xl opacity-80 hover:opacity-100">
                  Already have an account?{" "}
                  <span className="text-secondary uppercase underline cursor-pointer">
                    Login
                  </span>
                </Link>
              </div>
            </div>
          </form>

          {/* <h3 className="text-white text-2xl my-2">OR</h3> */}

          {/* Whatsapp */}
          <div className="max-w-2xl w-full space-y-2 bg-black/70 rounded-sm shadow-lg px-2 backdrop-blur-md pt-4 pb-8">
            <div className="text-xl text-white flex flex-row text-left px-2 py-2 justify-center items-center rounded-sm">Now create an account easily on WhatsApp</div>
            <div className="flex flex-row justify-between items-start text-white max-w-sm mx-auto text-left">
              <div className="flex flex-row justify-center items-center">
                <BsGiftFill className="w-12 h-12 text-secondary mr-2" />
                <h3>24/7 Customer<br />Service</h3>
              </div>
              <div className="flex flex-row justify-center items-center">
                <FaCoins className="w-12 h-12 text-secondary mr-2" />
                <h3>24/7 Instant<br />Withdrawal</h3>
              </div>
            </div>
            <div>
              {/* whatsapp button with floating logo */}
              <Link
                href={`https://wa.me/${site.whatsapp_number}?text=Hi%20I%20want%20to%20get%20new%20ID`}
                target="_blank" rel="noreferrer"
                className="text-white text-xl bg-green-600 flex flex-row text-left px-2 py-2 max-w-md mx-auto justify-center items-center rounded relative mt-6 animate-[pulse_1s_cubic-bezier(0.4,_0,_0.6,_1)_infinite] uppercase font-semibold"><Image src="/whatsapp.png" alt="whatsapp" width={50} height={50} className="absolute -top-3 -left-2" />Click Here</Link>
            </div>
          </div>

          <p className="text-base text-white/75 mt-6 max-w-2xl px-2"><span className="font-bold">Disclaimer:</span> This Website is only for 18+ users. If you are from Telangana, Orissa, Assam, Sikkim, and Nagaland, please leave the website immediately.</p>

        </div>
        <ToastContainer
          position="bottom-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </>
  );
}
