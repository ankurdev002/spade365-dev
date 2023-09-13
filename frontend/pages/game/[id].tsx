import Head from "next/head";
import React, { useEffect, useState } from "react";
// import { CgSpinner } from "react-icons/cg";
import useUser from "../../hooks/useUser";
import LoginModal, { Action } from "../../components/LoginModal";
import { useRouter } from "next/router";
import useGames from "../../hooks/useGames";
import { Game } from "../../store/Games";
// import { useEffect } from "react";

export default function GamePage() {
    const router = useRouter();
    const gamesList = useGames();
    const [game, setGame] = React.useState<Game | undefined>(undefined);
    const { isLoggedIn, user, logout, token } = useUser();
    const [loginVisibile, setLoginVisible] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            setLoginVisible(true);
        }
    }, [user]);

    // get id and game from url params (e.g. /game/123)
    const { id } = router.query;

    // if id or game is undefined, redirect to home page
    useEffect(() => {
        if (id && gamesList.games.find((game) => game.id === parseInt(id as string))) {
            setGame(gamesList.games.find((game) => game.id === parseInt(id as string)));
        }
    }, [gamesList]);

    return (
        <>
            <Head>
                <title>Play {game?.name || "Live Casino, Teen Patti"} Online in India | Spade365</title>
                <meta name="description" content={`Play ${game?.name || "Live Casino, Teen Patti"} Online Casino Games at Spade365.com. With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting.`} />
            </Head>
            <div className="flex flex-col justify-center items-start lg:items-center min-h-[85vh] !h-full w-full">
                {isLoggedIn ? (
                    <>
                        <div className="bg-primary border-t border-white/20 text-white font-normal py-2 px-4 w-full text-center shadow animate__animated animate__fadeInDown">
                            <h1 className="text-xl capitalize">Playing {game?.name}</h1>
                        </div>
                        <div className="!h-full !w-full min-h-full relative">
                            {/* <CgSpinner className="animate-spin text-4xl text-accent absolute top-[50%] left-[50%]" style={{ zIndex: 1 }} /> */}
                            {game?.api === "fawk" ? (
                                <>
                                    {/* desktop iframe */}
                                    <div className="!w-full min-h-full !h-full z-10 max-xl:hidden">
                                        <iframe src={`https://d2.fawk.app/#/splash-screen/${token}/9507${game?.code ? '?opentable=' + game?.code : ''}`} className="!h-full !w-full min-h-full" title={game?.name as string || ""} />
                                    </div>
                                    {/* mobile iframe */}
                                    <div className="!w-full min-h-full !h-full z-10 xl:hidden">
                                        <iframe src={`https://m2.fawk.app/#/splash-screen/${token}/9507${game?.code ? '?opentable=' + game?.code : ''}`} className="!h-full !w-full min-h-full" title={game?.name as string || ""} />
                                    </div>
                                </>
                            ) : (game?.api === "wacs") ? (
                                <div className="w-full min-h-full h-full z-10">
                                    {/* wacs type=FREE or CHARGED */}
                                    <iframe src={`https://pi.njoybingo.com/game.do?lang=en&token=${token}&pn=fancybet&type=CHARGED&game=${game?.code}`} title={game?.name as string || ""} className="w-full h-full min-h-full" />
                                </div>
                            ) : (
                                <div className="flex flex-col justify-center items-center h-full w-full">
                                    <h1 className="text-2xl font-bold">Game not found</h1>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col justify-center items-center h-full w-full">
                            <h1 className="text-2xl font-bold">Please Login to Play</h1>
                            {/* login/signup button */}
                            <button
                                className="bg-accent text-white font-bold py-2 px-4 rounded mt-4"
                                onClick={() => setLoginVisible(true)}
                            >
                                Login/Signup
                            </button>
                        </div>
                        <LoginModal
                            isOpen={loginVisibile}
                            closeModal={() => setLoginVisible(false)}
                            active={"login" as Action}
                        />
                    </>
                )}
            </div>
        </>
    )
}