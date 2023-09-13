import Head from "next/head";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import GameGrid from "../components/GameGrid";
import Image from "next/image";

export default function LiveCasino() {
    const router = useRouter();
    const [search, setSearch] = useState("");

    // refs for divs
    const allGamesRef = useRef<HTMLDivElement>(null);
    const indianGamesRef = useRef<HTMLDivElement>(null);
    const topGamesRef = useRef<HTMLDivElement>(null);
    const liveGamesRef = useRef<HTMLDivElement>(null);
    const tableGamesRef = useRef<HTMLDivElement>(null);
    const pokerGamesRef = useRef<HTMLDivElement>(null);
    // const slotsGamesRef = useRef<HTMLDivElement>(null);
    const blackjackGamesRef = useRef<HTMLDivElement>(null);
    const rouletteGamesRef = useRef<HTMLDivElement>(null);
    const baccaratGamesRef = useRef<HTMLDivElement>(null);
    const gamesShowsRef = useRef<HTMLDivElement>(null);
    const virtualGamesRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Head>
                <title>Play Live Casino, Teen Patti Online in India | Spade365</title>
                <meta name="description" content="Play Online Casino Games at Spade365.com. With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting." />
            </Head>
            <div className="w-full h-full min-h-screen bg-black">
                <div className="relative w-full h-full bg-gradient-to-tr from-teal-600 to-pink-600 via-sky-700 animate-gradient-xy flex flex-col overflow-hidden">
                    {/* Hero */}
                    <div className="animate__animated animate__fadeInUp w-full py-8 flex flex-col justify-center items-center z-10 relative">
                        <Image src="/img/live-casino.gif" alt="Slot" width={1000} height={500} className="absolute top-0 left-0 w-full h-full object-cover object-top opacity-40 z-1" />
                        <div className="z-10">
                            <p className="text-xl mb-4 uppercase text-center animate-text bg-gradient-to-br from-white to-amber-500/80 bg-clip-text text-transparent font-black">Spade365 Presents</p>
                            <h1 className="text-6xl md:text-7xl text-stroke-white text-shadow uppercase animate-text bg-gradient-to-r from-red-600 to-yellow-600 bg-clip-text text-transparent font-black tracking-tight text-center">Live Casino</h1>
                            <p className="text-xl mt-4 uppercase text-center animate-text bg-gradient-to-br from-white to-green-500/40 bg-clip-text text-transparent font-black">Exciting and unparalleled<br />gaming experience</p>
                            {/* Search input with icon */}
                            <div className="animate__animated animate__fadeInDown relative w-full flex items-center justify-center max-w-xs mx-auto mt-4">
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
                    </div>
                    {/* background blur circles */}
                    <div className="absolute top-0 z-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 z-0 -right-4 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 z-0 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    <div className="absolute -bottom-8 z-0 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
                    <div className="absolute -bottom-8 z-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-8000"></div>

                    {/* Games */}
                    <div className="container w-full px-2 pb-8 md:px-0 z-1 mt-4">


                        {search ? (
                            <>
                                <GameGrid title="Search Results" search={search} overflow={false} showIcon={false} />
                            </>
                        ) : (
                            <>
                                <div className="animate__animated animate__fadeInUp grid grid-cols-6 md:grid-cols-5 gap-2">
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-teal-200 to-pink-500 via-cyan-200  shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                allGamesRef?.current && allGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            All Games
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-teal-200 to-red-500 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                blackjackGamesRef?.current && blackjackGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Blackjack
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-teal-200 to-yellow-500 via-slate-300 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                topGamesRef?.current && topGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Top Games
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-teal-200 to-orange-500 shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                baccaratGamesRef?.current && baccaratGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Baccarat
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-green-300 to-purple-200 via-sky-300  shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                liveGamesRef?.current && liveGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Live Games
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-red-200 to-sky-500  shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                rouletteGamesRef?.current && rouletteGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Roulette
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-sky-200 to-teal-200 via-cyan-100  shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                tableGamesRef?.current && tableGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Table Games
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-orange-200 to-yellow-200 via-orange-300  shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                gamesShowsRef?.current && gamesShowsRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Games Shows
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-green-200 to-blue-300 via-red-300  shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                pokerGamesRef?.current && pokerGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Poker
                                        </button>
                                    </div>
                                    <div className="col-span-3 md:col-span-1">
                                        <button className="w-full py-2 text-lg text-center text-black bg-gradient-to-tr from-red-200 to-orange-300 via-purple-300  shadow border animate-gradient-xy bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-transparent"
                                            onClick={() => {
                                                virtualGamesRef?.current && virtualGamesRef.current.scrollIntoView({ behavior: "smooth" });
                                            }}>
                                            Virtual
                                        </button>
                                    </div>
                                </div>

                                <div className="max-w-full mt-8">
                                    {/* All Games */}
                                    <div ref={allGamesRef}>
                                        <GameGrid title="All Games" exclude="slot" tag="live" limit={30} overflow={false} showIcon={false} />
                                    </div>
                                    {/* Top Games */}
                                    <div ref={topGamesRef}>
                                        <GameGrid title="Top Games" exclude="slot" tag="casino" limit={30} overflow={false} showIcon={false} />
                                    </div>
                                    {/* Indian Card Games */}
                                    <div ref={indianGamesRef}>
                                        {/* <GameGrid title="Indian Card Games" exclude="slot" tag="indian" overflow={false} showIcon={false} /> */}
                                    </div>
                                    {/* Live Games */}
                                    <div ref={liveGamesRef}>
                                        <GameGrid title="Live Games" exclude="slot" tag="live" limit={30} overflow={false} showIcon={false} />
                                    </div>
                                    {/* Table Games */}
                                    <div ref={tableGamesRef}>
                                        <GameGrid title="Table Games" exclude="slot" tag={["table"]} limit={30} overflow={false} showIcon={false} />
                                    </div>
                                    {/* Poker Games */}
                                    <div ref={pokerGamesRef}>
                                        <GameGrid title="Poker" tag={["poker"]} exclude="slot" limit={30} overflow={false} showIcon={false} />
                                    </div>
                                    {/* Blackjack */}
                                    <div ref={blackjackGamesRef}>
                                        <GameGrid title="Blackjack" tag={["blackjack"]} limit={30} exclude="slot" overflow={false} showIcon={false} />
                                    </div>
                                    {/* Baccarat */}
                                    <div ref={baccaratGamesRef}>
                                        <GameGrid title="Baccarat" tag={["baccarat"]} limit={30} exclude="slot" overflow={false} showIcon={false} />
                                    </div>
                                    {/* Roulette */}
                                    <div ref={rouletteGamesRef}>
                                        <GameGrid title="Roulette" tag={["roulette"]} limit={30} exclude="slot" overflow={false} showIcon={false} />
                                    </div>
                                    {/* Games Shows */}
                                    <div ref={gamesShowsRef}>
                                        <GameGrid title="Games Shows" tag={["live"]} limit={30} exclude="slot" overflow={false} showIcon={false} />
                                    </div>
                                    {/* Slots */}
                                    {/* <div ref={slotsGamesRef}>
                                    <GameGrid title="Slots" tag="slot" exclude="slot" overflow={false} showIcon={false} />
                                </div> */}
                                    {/* Virtual */}
                                    <div ref={virtualGamesRef}>
                                        <GameGrid title="Virtual" tag="virtual" exclude="slot" limit={30} overflow={false} showIcon={false} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}