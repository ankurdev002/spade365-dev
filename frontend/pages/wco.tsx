import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import LoginModal, { Action } from "../components/LoginModal";
import useUser from "../hooks/useUser";
import { CgSpinner } from "react-icons/cg";

export default function WCO() {
    const router = useRouter();
    const [launchUrl, setLaunchUrl] = useState("");
    const [sessionId, setSessionId] = useState("");
    const { isLoggedIn, user, logout, token } = useUser();
    const [loginVisibile, setLoginVisible] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            setLoginVisible(true);
        }
    }, [user]);

    // get id and game from url params (e.g. /game?id=123&game=poker)
    const { id, game, pr, name } = router.query;

    // if id or game is undefined, redirect to home page
    // useEffect(() => {
    //     if (!id || !game) {
    //         router.push("/");
    //     }
    // }, [id, game]);

    // get game embed iframe url
    const getGameIframe = async () => {
        // if (launchUrl !== "" && sessionId !== "") return;
        const data = await fetch(`/api/wco/auth/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    gameCode: game,
                    providerCode: pr,
                }
            ),
        })
            .then((res) => res.json())
            .then((data) => {
                setLaunchUrl(data.launchURL);
                setSessionId(data.sessionId);
            })
            .catch((err) => {
                console.log(err);
            });
        // return data;
    };

    useEffect(() => {
        if (!router.query || !isLoggedIn) return;
        getGameIframe();
    }, [router.query]);

    return (
        <>
            <Head>
                <title>Play {name || "Evolution Games, Ezugi Games"} Online in India | Spade365</title>
                <meta name="description" content="Play Online Casino Games at Spade365.com. With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting." />
            </Head>
            <div className="flex flex-col justify-center items-center min-h-[85vh] h-full w-full bg-black text-white">
                {isLoggedIn ? (
                    <div className="h-full w-full relative">
                        <CgSpinner className="animate-spin text-4xl text-accent absolute top-[50%] left-[50%]" style={{ zIndex: 1 }} />
                        <div className="w-full h-full z-10 relative">
                            <iframe src={launchUrl as string} title={name as string || ""} className="w-full h-full" />
                        </div>
                    </div>
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