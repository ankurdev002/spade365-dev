import Head from "next/head";
import { useRef } from "react";
import GameGrid from "../components/GameGrid";
import Image from "next/image";

export default function IndianCardGames() {

    // refs for divs
    const liveIndianGamesRef = useRef<HTMLDivElement>(null);
    const indianCardGamesRef = useRef<HTMLDivElement>(null);
    const indianVirtualGamesRef = useRef<HTMLDivElement>(null);
    const indianSlotGamesRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <Head>
                <title>Play Indian Card Games, Teen Patti Online in India | Spade365</title>
                <meta name="description" content="Play Indian Card Games Online Casino Games at Spade365.com. With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting." />
            </Head>
            <div className="w-full h-full min-h-screen bg-black">
                <div className="relative w-full h-full bg-gradient-to-tr from-accent to-secondary via-red-500 animate-gradient-xy flex flex-col overflow-hidden">
                    {/* Hero */}
                    <div className="animate__animated animate__fadeInDown w-full py-8 flex flex-col justify-center items-center z-10 relative">
                        <Image src="/img/indian-card-games.gif" alt="Slot" width={1000} height={500} className="absolute top-0 left-0 w-full h-full object-cover object-top opacity-40 z-1" />
                        <div className="z-10">
                            <p className="text-xl mb-4 uppercase text-center animate-text bg-gradient-to-br from-white to-amber-500/50 bg-clip-text text-transparent font-black">Spade365 Presents</p>
                            <h1 className="text-6xl md:text-7xl text-stroke-white text-shadow uppercase animate-text bg-clip-text text-transparent font-black tracking-tight text-center">Indian Card Games</h1>
                            <p className="text-xl mt-4 uppercase text-center animate-text bg-gradient-to-br from-white to-yellow-500 bg-clip-text text-transparent font-black">Teen Patti, Andar Bahar<br />&amp; much more....</p>
                        </div>
                    </div>
                    {/* background blur circles */}
                    <div className="absolute top-0 z-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 z-0 -right-4 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 z-0 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    <div className="absolute -bottom-8 z-0 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
                    <div className="absolute -bottom-8 z-0 left-1/2 transform -translate-x-1/2 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-8000"></div>

                    {/* Games */}
                    <div className="container w-full px-2 pb-8 md:px-0 z-1 mt-6">
                        <div className="max-w-full">
                            <div ref={liveIndianGamesRef}>
                                <GameGrid title="Live Indian Games" exclude="slot" tag={["indian", "live"]} api="fawk" overflow={false} showIcon={false} limit={80} />
                            </div>
                            {/* <div ref={indianCardGamesRef}>
                                <GameGrid title="Indian Card Games" exclude="slot" tag={["indian", "card"]} api="fawk" overflow={false} showIcon={false} />
                            </div> */}
                            <div ref={indianVirtualGamesRef}>
                                <GameGrid title="Indian Virtual Games" exclude="slot" tag={["indian", "virtual"]} api="fawk" overflow={false} showIcon={false} limit={80} />
                            </div>
                            {/* <div ref={indianSlotGamesRef}>
                                <GameGrid title="Indian Slot Games" tag={["indian", "slot"]} overflow={false} showIcon={false} />
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}