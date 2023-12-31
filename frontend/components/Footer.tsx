import Link from "next/link";
import { BsInstagram, BsTelegram, BsWhatsapp } from "react-icons/bs";
import Image from "next/image"
// import Logo from "../public/spade.png"
import Logo from "./Logo"
import useSiteContext from "../hooks/useSiteContext";


const Footer = () => {
    const site = useSiteContext();
    return (
        <>
            <div className="flex flex-col justify-center items-center text-white break-words bg-black overflow-hidden border-t-2 border-opacity-20 border-white">
                <div className="grid grid-cols-8 text-black break-words text-center mt-4 lg:mt-12 gap-4">
                    <div
                        className="col-span-4 md:col-span-2 py-3 px-4 text-sm text-white bg-accent hover:bg-opacity-80 cursor-pointer uppercase rounded-xl"
                    >
                        <Link
                            href="/"
                            className="break-words bg-transparent"
                        >Introduction</Link>
                    </div>
                    <div
                        className="col-span-4 md:col-span-2 py-3 px-4 text-sm text-white bg-accent hover:bg-opacity-80 cursor-pointer uppercase rounded-xl"
                    >
                        <Link
                            href="/"
                            className="break-words bg-transparent"
                        >How to register</Link>
                    </div>
                    <div
                        className="col-span-4 md:col-span-2 py-3 px-4 text-sm text-white bg-accent hover:bg-opacity-80 cursor-pointer uppercase rounded-xl"
                    >
                        <Link
                            href="/"
                            className="break-words bg-transparent"
                        >How to deposit</Link>
                    </div>
                    <div
                        className="col-span-4 md:col-span-2 py-3 px-4 text-sm text-white bg-accent hover:bg-opacity-80 cursor-pointer uppercase rounded-xl"
                    >
                        <Link
                            href="/"
                            className="break-words bg-transparent"
                        >How to use bonus</Link>
                    </div>
                </div>

                {/* <div className="flex justify-center items-center pt-4 text-3xl font-bold text-center text-white break-words cursor-pointer mt-6 hover:opacity-80">
                    <div className="inline-block relative my-0 mx-2 font-bold text-white">
                        <BsWhatsapp className="text-green-500" />
                    </div>
                    <div className="font-bold text-green-500 cursor-pointer">WHATSAPP US!</div>
                </div> */}

                <div className="flex flex-row justify-center items-center pt-4 text-3xl font-bold text-center text-white break-words cursor-pointer mt-4 mb-6">
                    <Link
                        href={`https://wa.me/${site?.whatsapp_number}?text=Hi%20I%20want%20to%20get%20new%20ID`}
                        target={"_blank"}
                        rel="noreferrer"
                        className="inline-block relative my-0 mx-2 font-bold text-white hover:opacity-80">
                        <Image src="/img/whatsapp.png" width={30} height={30} alt={""} />
                    </Link>
                    {/* <div className="inline-block relative my-0 mx-2 font-bold text-white hover:opacity-80">
                        <BsTelegram className="text-blue-300" />
                    </div> */}
                    <Link
                        href={`https://www.instagram.com/spade365official/`}
                        target={"_blank"}
                        rel="noreferrer"
                        className="inline-block relative my-0 mx-2 font-bold text-white hover:opacity-80">
                        <Image src="/img/instagram.png" width={40} height={40} alt={""} />
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row items-center md:pl-2 break-words max-w-7xl">
                    <Link href="/about" className="">
                        <Logo />
                    </Link>
                    <p className="text-xs font-normal text-left text-white py-6 px-4 max-w-5xl">
                        Spade365.com is operated by Spade. Players
                        are requested not to contact any untrusted sources for Spade365 accounts as
                        this is an online site and users can only register independently without any
                        agents. Only deposit through the account details generated by the system or
                        provided by our official support team.
                    </p>
                </div>

                {/* paytm, upi etc  */}
                <div className="grid grid-cols-6 text-black break-words text-center mt-4 lg:mt-12 gap-4 md:gap-12 lg:gap-24 px-4 pb-12 md:max-w-3xl xl:max-w-5xl">
                    <div>
                        <Image className="opacity-40" src="/img/paytm.png" alt="spade" width={200} height={73} quality={10} />
                    </div>
                    <div>
                        <Image className="opacity-40" src="/img/upi.png" alt="spade" width={200} height={73} quality={10} />
                    </div>
                    <div>
                        <Image className="opacity-40" src="/img/bank-transfer.png" alt="spade" width={200} height={73} quality={10} />
                    </div>
                    <div>
                        <Image className="opacity-40" src="/img/gamble-aware.png" alt="spade" width={200} height={73} quality={10} />
                    </div>
                    <div>
                        <Image className="opacity-40" src="/img/gambling-commission.png" alt="spade" width={200} height={73} quality={10} />
                    </div>
                    <div>
                        <Image className="opacity-40" src="/img/mga.png" alt="spade" width={200} height={73} quality={10} />
                    </div>
                </div>
            </div>
        </>

    )
}

export default Footer