import Head from "next/head";
import React, { useEffect } from "react";
import { useRouter } from "next/router";
import useGames from "../../hooks/useGames";
import Image from "next/image";
import GameGrid from "../../components/GameGrid";

export default function GameProviderPage() {
    const router = useRouter();
    const gamesList = useGames();

    // get game provider from url params e.g. /game/xyz where xyz is the game provider
    const { provider } = router.query;

    // if provider not in gamesList.providers, redirect to home page
    useEffect(() => {
        if (gamesList.providers.length > 0 && !gamesList.providers.includes(provider as string)) router.push("/");
    }, [gamesList.providers, provider]);

    return (
        <>
            <Head>
                <title>Play {provider || "Ezugi, Evolution, Superspade"} Games Online in India | Spade365</title>
                <meta name="description" content={`Play ${provider || "Ezugi, Evolution, Superspade"} Online Casino Games at Spade365.com. With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting.`} />
            </Head>
            <div className="w-full h-full min-h-screen bg-black">
                <div className="relative w-full h-full bg-gradient-to-tr from-teal-600 to-pink-600 via-sky-700 animate-gradient-xy flex flex-col overflow-hidden">
                    {/* Hero */}
                    <div className="animate__animated animate__fadeInUp w-full py-8 flex flex-col justify-center items-center z-10 relative">
                        {/* <Image src="/img/live-casino.gif" alt="Slot" width={1000} height={500} className="absolute top-0 left-0 w-full h-full object-cover object-top opacity-40 z-1" /> */}
                        <div className="z-10">
                            <h1 className="text-6xl md:text-7xl text-shadow capitalize text-white font-black tracking-tight text-center">{
                                Array.isArray(provider) ? provider[0].toLowerCase() : provider?.toLowerCase()
                            }</h1>
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
                        {provider && (
                            <GameGrid limit={2000} title={'Games by ' + provider as string} overflow={false} showIcon={false} provider={Array.isArray(provider) ? provider : [provider]} />
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}