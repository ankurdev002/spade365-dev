import Head from "next/head";
import SportsBook from "../../components/SportsBook";

export default function SportsBookPage() {
    return (
        <>
            <Head>
                <title>Sportsbook | Spade365</title>
                <meta name="description" content={`Play Sportsbook Online Cricket, Soccer, Tennis Betting at Spade365.com. With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting.`} />
            </Head>
            <div className="px-1 my-8">
                <SportsBook minimal={false} limit={20} />
            </div>
        </>
    );
}
