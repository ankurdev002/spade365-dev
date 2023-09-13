import Link from "next/link";
import { useEffect, useState } from "react";
import { BsFillSuitSpadeFill } from "react-icons/bs";
import Image from "next/image";
import { Game } from "../store/Games";
import useGames from "../hooks/useGames";
import { FiMinus, FiPlus } from "react-icons/fi";

interface GameGridProps {
    title: string;
    tag?: string | string[];
    api?: string;
    provider?: string[];
    exclude?: string | string[];
    category?: string;
    search?: string;
    limit?: number;
    overflow?: boolean; // if true make grid overflow-x-auto and go outside of container
    big?: boolean; // if true show 2 items in row, else 4. mobile only. desktop stays the same
    showIcon?: boolean;
}

const GameGrid: React.FC<GameGridProps> = ({ title = "All Games", tag, api, exclude, provider, category, search, limit = 16, overflow = true, big = false, showIcon = true }) => {
    const [games, setGames] = useState([] as Game[]);
    const gamesList = useGames();
    const [showMore, setShowMore] = useState(false);
    const [areMoreGames, setAreMoreGames] = useState(false);

    const getGames = () => {
        let games = gamesList.games;

        if (api) games = games.filter((game) => game.api === api);

        if (provider) games = games.filter((game) => provider.includes(game.provider));

        if (tag) {
            // match tags ignoring case
            if (typeof tag === "string") games = games.filter((game) => game.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()));
            else if (Array.isArray(tag)) games = games.filter((game) => tag.every((t) => game.tags.map((t) => t.toLowerCase()).includes(t.toLowerCase())));
        }

        if (exclude) {
            // exclude tags ignoring case
            if (typeof exclude === "string") games = games.filter((game) => !game.tags.map((t) => t.toLowerCase()).includes(exclude.toLowerCase()));
            else if (Array.isArray(exclude)) games = games.filter((game) => !exclude.some((t) => game.tags.map((t) => t.toLowerCase()).includes(t.toLowerCase())));
        }

        if (category) games = games.filter((game) => game.category === category);

        if (search) games = games.filter((game) => game.name.toLowerCase().includes(search.toLowerCase()));

        if (games.length > limit) setAreMoreGames(true);
        else setAreMoreGames(false);

        if (!showMore) games = games.slice(0, limit); // show limit games when showMore is false
        else games = games.slice(0, limit + 40);

        // sort by is_featured
        games.sort((a, b) => (a.is_featured ? -1 : 1));

        // shuffle games
        // for (let i = games.length - 1; i > 0; i--) {
        //     const j = Math.floor(Math.random() * (i + 1));
        //     [games[i], games[j]] = [games[j], games[i]];
        // }
        setGames(games);
    }

    useEffect(() => {
        getGames();
    }, [showMore, gamesList.games, search]);

    return (
        <div className={`animate__animated animate__fadeInUp mb-6 ${showIcon && 'bg-gradient-to-r from-accent/80 to-secondary/80 rounded-lg px-4 py-4'}`}>
            <div className={`text-white capitalize rounded-tl-xl rounded-tr-xl text-left text-base md:text-lg font-bold leading-4 tracking-wider flex flex-row justify-between items-center w-full mb-3`}>
                <div className="flex justify-center items-center">
                    {showIcon && <BsFillSuitSpadeFill className="w-6 h-6 mr-4" />}
                    <span>{title}</span>
                </div>
                <div className="flex justify-end items-center">
                    {areMoreGames && (
                        <button
                            className="text-white text-sm font-light tracking-wider"
                            onClick={() => setShowMore(!showMore)}
                        >
                            {showMore ? <div className="flex flex-row items-center justify-center"><FiMinus className="mr-1" /> <span>Show Less</span></div> : <div className="flex flex-row items-center justify-center"><FiPlus className="mr-1" /><span>Show More</span></div>}
                        </button>
                    )}
                </div>
            </div>
            <div className="w-full !overflow-x-auto scrollbar-hide">
                <div className={`grid ${overflow ? 'md:grid-cols-8 grid-cols-4' : 'md:grid-cols-7 grid-cols-3'} ${big ? 'grid-cols-2 md:grid-cols-4' : ''} gap-2 text-left bg-transparent ${overflow && 'min-w-[500px]'} !overflow-x-auto`}>
                    {games.map((game) => (
                        <div key={game.id} className="col-span-1">
                            <Link href={`/game/${game.id}`} title={`Play ${game.name} Online in India at Spade365`}>
                                <div className={`relative w-full ${big ? 'h-48 md:h-56' : overflow ? 'h-24 md:h-32' : 'h-32 md:h-40'} rounded-lg overflow-hidden hover:shadow-2xl`}>
                                    <>
                                        <Image
                                            className="rounded object-cover object-top"
                                            // if game.image is not present or has /gamepr in it, use random img
                                            src={game.image && !game.image.includes("/gamepr") ? game.image : `/img/casino/${Math.floor(Math.random() * 46) + 1}.jpg`}
                                            alt={game.name}
                                            fill={true}
                                        />
                                        {game.api !== 'fawk' && (
                                            <span className="text-[6px] md:text-[10px] font-light tracking-wider capitalize inline-block !leading-3 top-1 right-1 absolute text-white bg-accent/90 px-1 py-[2px] rounded">{game.provider}</span>
                                        )}
                                        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-t ${['from-teal-900', 'from-yellow-900', 'from-blue-900', 'from-green-900', 'from-red-900', 'from-orange-900', 'from-purple-900', 'from-sky-900', 'from-pink-900'].find((_, i, ar) => Math.random() < 1 / (ar.length - i))} via-transparent to-transparent`}></div>
                                        <div className={`absolute ${big ? 'bottom-2' : 'bottom-0'} left-0 w-full text-white p-1`}>
                                            <div className="flex flex-col">
                                                <h3 className={`${big ? 'text-2xl' : 'text-xs overflow-hidden text-ellipsis whitespace-nowrap max-w-[110px] md:text-sm lg:max-w-[130px]'} font-semibold capitalize !leading-4`}>{game.name}</h3>
                                                {/* <span className="text-[8px] md:text-[10px] font-light tracking-wider inline-block !leading-3 lowercase">{game.category && game.category}</span> */}
                                            </div>
                                        </div>
                                    </>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default GameGrid