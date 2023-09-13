import Link from "next/link";
import { useEffect, useState } from "react";
import { BsFillSuitSpadeFill } from "react-icons/bs";
import Image from "next/image";
// import { Game } from "../store/Games";
import useGames from "../hooks/useGames";
import { FiMinus, FiPlus } from "react-icons/fi";

interface GameProviderGridProps {
    title: string;
    exclude?: string | string[];
    limit?: number;
    overflow?: boolean;
    showIcon?: boolean;
}

const GameProviderGrid: React.FC<GameProviderGridProps> = ({ title = "Providers", exclude, limit = 50, overflow = true, showIcon = true }) => {
    const [providers, setProviders] = useState<Array<string>>([]);
    const gamesList = useGames();
    const [showMore, setShowMore] = useState(false);

    const getProviders = () => {
        let providers = gamesList.providers;

        if (exclude) {
            if (typeof exclude === "string") {
                providers = providers.filter((provider) => provider !== exclude);
            } else if (Array.isArray(exclude)) {
                // all exclude must be excluded
                providers = providers.filter((provider) => exclude.every((t) => provider !== t));
            }
        }

        if (!showMore) {
            providers = providers.slice(0, limit); // show limited providers when showMore is false
        } else {
            providers = providers.slice(0, 80); // show max 80 providers when showMore is true
        }

        setProviders(providers);
    }

    const getGameProviderImage = (provider: string) => {
        return `/img/providers/${provider.toLowerCase().replace(/ /g, "-")}.jpg`;
    };

    useEffect(() => {
        getProviders();
    }, [showMore, gamesList.providers]);

    return (
        <div className={`animate__animated animate__fadeInUp mb-6 ${showIcon && 'bg-gradient-to-r from-accent/80 to-secondary/80 rounded-lg px-4 py-4'}`}>
            <div className={`text-white capitalize rounded-tl-xl rounded-tr-xl text-left text-base md:text-lg font-bold leading-4 tracking-wider flex flex-row justify-between items-center w-full mb-3`}>
                <div className="flex justify-center items-center">
                    {showIcon && <BsFillSuitSpadeFill className="w-6 h-6 mr-4" />}
                    <span>{title}</span>
                </div>
                <div className="flex justify-end items-center">
                    {providers.length > limit && (
                        <button
                            className="text-black text-sm font-light tracking-wider"
                            onClick={() => setShowMore(!showMore)}
                        >
                            {showMore ? <div className="flex flex-row items-center justify-center"><FiMinus className="mr-1" /> <span>Show Less</span></div> : <div className="flex flex-row items-center justify-center"><FiPlus className="mr-1" /><span>Show More</span></div>}
                        </button>
                    )}
                </div>
            </div>
            <div className="w-full !overflow-x-auto scrollbar-hide">
                <div className={`grid ${overflow ? 'grid-cols-4 md:grid-cols-8' : 'grid-cols-4 md:grid-cols-10'} gap-2 text-left bg-transparent ${overflow && 'min-w-[500px]'} !overflow-x-auto`}>
                    {providers.map((provider, index) => (
                        <div key={provider + index} className="col-span-1">
                            <Link href={`/game/?provider=${provider}`} title={`Play ${provider} Games Online in India at Spade365`}>
                                <div className="relative w-full h-24 md:h-32 rounded-lg overflow-hidden hover:shadow-2xl">
                                    <>
                                        <Image
                                            className="rounded object-cover object-top"
                                            src={getGameProviderImage(provider)}
                                            alt={provider}
                                            fill={true}
                                        />
                                        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r ${['from-teal-900', 'from-yellow-900', 'from-blue-900', 'from-green-900', 'from-red-900', 'from-orange-900', 'from-purple-900', 'from-sky-900', 'from-pink-900'].find((_, i, ar) => Math.random() < 1 / (ar.length - i))} via-transparent to-transparent`}></div>
                                        <div className="absolute bottom-0 left-0 w-full text-white p-1">
                                            <div className="flex flex-col">
                                                <h3 className="text-xs md:text-sm font-semibold capitalize !leading-4 overflow-hidden text-ellipsis whitespace-nowrap">{provider.toLowerCase()}</h3>
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

export default GameProviderGrid