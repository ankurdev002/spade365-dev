import Head from "next/head";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import GameGrid from "../components/GameGrid";
import Image from "next/image";

export default function SlotsGames() {
    const router = useRouter();
    const [search, setSearch] = useState("");

    // refs for divs
    const allSlotsGamesRef = useRef<HTMLDivElement>(null);
    const fishingGamesRef = useRef<HTMLDivElement>(null);
    const multiplayerGamesRef = useRef<HTMLDivElement>(null);
    const bingoGamesRef = useRef<HTMLDivElement>(null);
    const scratchCardGamesRef = useRef<HTMLDivElement>(null);
    const instantGamesRef = useRef<HTMLDivElement>(null);
    const virtualSportsRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Head>
                <title>Play Slots Games Online in India | Spade365</title>
                <meta name="description" content="Play Online Slots Games at Spade365.com. With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting." />
            </Head>
            <div className="w-full h-full min-h-screen bg-black">
                <div className="relative w-full h-full bg-gradient-to-tr from-green-600 to-sky-600 via-orange-600 animate-gradient-xy flex flex-col overflow-hidden">
                    {/* Hero */}
                    <div className="w-full py-12 flex flex-col justify-center items-center relative ">
                        <Image src="/img/slot-machine.gif" alt="Slot" width={1000} height={500} className="absolute top-0 left-0 w-full h-full object-cover opacity-40 z-1 invert" />
                        <h1 className="animate__animated animate__fadeInUp text-6xl uppercase z-10 text-white font-black text-shadow-lg text-center">Slots Games</h1>
                        {/* Search input with icon */}
                        <div className="animate__animated animate__fadeInDown relative w-full flex items-center justify-center max-w-xs mx-auto mt-4 z-10">
                            <input
                                type="text"
                                className="w-full px-6 py-2 text-lg text-left text-white border border-white placeholder:text-white/50 bg-gray-900 bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                placeholder="Search Games"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="absolute right-4">
                                <FiSearch className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                    {/* background blur circles */}
                    <div className="absolute top-0 z-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 z-0 -right-4 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 z-0 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    <div className="absolute -bottom-8 z-0 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
                    <div className="absolute -bottom-8 z-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-8000"></div>

                    {/* Games */}
                    <div className="container w-full px-2 py-8 md:px-0 z-1">
                        {search ? (
                            <>
                                <GameGrid title="Search Results" search={search} tag="slot" overflow={false} showIcon={false} />
                            </>
                        ) : (
                            <>
                                {/* <div className="animate__animated animate__fadeInUp grid grid-cols-6 md:grid-cols-5 gap-2 mt-8 mb-8">
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-orange-200 to-yellow-300 via-purple-300 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                allSlotsGamesRef?.current && allSlotsGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            All Slot
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-cyan-200 to-green-200 via-red-200 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                fishingGamesRef?.current && fishingGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Fishing Games
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-purple-200 to-orange-200 via-red-200 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                multiplayerGamesRef?.current && multiplayerGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Multiplayer
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-blue-200 to-red-200 via-cyan-200 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                bingoGamesRef?.current && bingoGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Bingo
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-yellow-200 to-blue-200 via-cyan-200 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                scratchCardGamesRef?.current && scratchCardGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Scratch Cards
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-orange-300 to-sky-200 via-blue-300 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                instantGamesRef?.current && instantGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Instant Games
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-sky-200 to-blue-200 via-red-200 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                virtualSportsRef?.current && virtualSportsRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Virtual Sports
                                        </button>
                                    </div>
                                </div> */}

                                {/* <div ref={allSlotsGamesRef}>
                                    <GameGrid title="Slots Games by NetEnt" provider={["netent"]} limit={80} overflow={false} showIcon={false} />
                                </div> */}
                                <div ref={multiplayerGamesRef}>
                                    <GameGrid title="All Slot Games" tag={["slot"]} limit={80} overflow={false} showIcon={false} big={true} />
                                </div>
                                {/* <div ref={fishingGamesRef}>
                                    <GameGrid title="Fishing Games" tag="fishing" overflow={false} showIcon={false} />
                                </div>
                                <div ref={bingoGamesRef}>
                                    <GameGrid title="Bingo" tag={["bingo", "slot"]} overflow={false} showIcon={false} />
                                </div>
                                <div ref={scratchCardGamesRef}>
                                    <GameGrid title="Scratch Cards" tag={["scratch", "slot"]} overflow={false} showIcon={false} />
                                </div>
                                <div ref={instantGamesRef}>
                                    <GameGrid title="Instant Games" tag={["instant", "slot"]} overflow={false} showIcon={false} />
                                </div>
                                <div ref={virtualSportsRef}>
                                    <GameGrid title="Virtual" tag={["virtual", "slot"]} overflow={false} showIcon={false} />
                                </div> */}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}