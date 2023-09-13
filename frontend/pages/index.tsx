import Head from "next/head";
import Image from "next/image";
import Slider from "react-slick";
import Link from "next/link";
import useSiteContext from "../hooks/useSiteContext";
import GameGrid from "../components/GameGrid";
import SportsBook from "../components/SportsBook";
import { MdSportsCricket, MdSportsScore, MdSportsTennis } from "react-icons/md";
import { BiFootball } from "react-icons/bi";
import { GROUP } from "../store/Sport";
// import GameProviderGrid from "../components/GameProviderGrid";

export default function Home() {
  const siteContext = useSiteContext();

  return (
    <>
      <Head>
        <title>Spade365 | Experience The Thrill Of Online Casino Gaming In India</title>
        <meta
          name="description"
          content="Join Spade365 today and start your winning streak! With our wide selection of games, generous bonuses, and secure platform, there's no better place to experience the thrill of online casino betting."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 3 cols in grid  */}
      <div className="grid grid-cols-8 text-center bg-transparent overflow-hidden md:px-4">
        {/* 1st col */}
        <div className="col-span-8 w-full">
          {/* Banners */}
          <Slider
            {...{
              dots: false,
              infinite: true,
              speed: 500,
              autoplay: true,
              slidesToShow: 3,
              slidesToScroll: 1,
              adaptiveHeight: true,
              className: "my-4 md:my-6 px-2 md:px-0 w-full",
              responsive: [
                {
                  breakpoint: 1024,
                  settings: {
                    centerMode: true,
                    slidesToShow: 2,
                    slidesToScroll: 1,
                  },
                },
                {
                  breakpoint: 768,
                  settings: {
                    centerMode: false,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                  },
                },
                {
                  breakpoint: 480,
                  settings: {
                    centerMode: false,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                  },
                }
              ],
            }}
          >
            {siteContext.banners.map((banner, index) => (
              <div key={index}>
                <Link href={banner.redirect}>
                  <Image
                    quality={30}
                    className="rounded-2xl"
                    src={banner.image}
                    alt=""
                    width={400}
                    height={150}
                    priority={true}
                  />
                </Link>
              </div>
            ))}
          </Slider>

          {/* Game slider */}
          <div className="animate__animated animate__fadeInDown grid grid-cols-4 gap-1 mb-2 px-2 text-left">
            <Link href="/sportsbook/?group=Cricket">
              <div className="relative rounded-lg min-h-[48px] bg-gradient-to-tl animate-gradient-xy from-accent via-teal-500 to-black overflow-hidden shadow-lg border-2 border-white">
                <Image
                  quality={10}
                  className="object-cover object-center opacity-20"
                  src="/img/cricket.png"
                  alt=""
                  fill
                />
                <div className="absolute top-0 left-0 flex flex-row items-center justify-center md:justify-start w-full h-full p-2">
                  <div className="text-[0.7rem] text-base font-bold italic tracking-[0.1em] capitalize text-white flex flex-col md:flex-row justify-center items-center">
                    <MdSportsCricket className="max-md:mb-1 mr-1 text-xl" />Cricket
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/sportsbook/?group=Soccer">
              <div className="relative rounded-lg min-h-[48px] bg-gradient-to-tl animate-gradient-xy from-accent via-primary to-black overflow-hidden shadow-lg border-2 border-white">
                <Image
                  quality={10}
                  className="object-cover object-center opacity-20"
                  src="/img/football.png"
                  alt=""
                  fill
                />
                <div className="absolute top-0 left-0 flex flex-row items-center justify-center md:justify-start w-full h-full p-2">
                  <div className="text-[0.7rem] text-base font-bold italic tracking-[0.1em] capitalize text-white flex flex-col md:flex-row justify-center items-center">
                    <BiFootball className="max-md:mb-1 mr-1 text-xl" />Football
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/sportsbook/?group=Tennis">
              <div className="relative rounded-lg min-h-[48px] bg-gradient-to-tl animate-gradient-xy from-primary via-accent to-black overflow-hidden shadow-lg border-2 border-white">
                <Image
                  quality={10}
                  className="object-cover object-center opacity-20"
                  src="/img/tennis.png"
                  alt=""
                  fill
                />
                <div className="absolute top-0 left-0 flex flex-row items-center justify-center md:justify-start w-full h-full p-2">
                  <div className="text-[0.7rem] text-base font-bold italic tracking-[0.1em] capitalize text-white flex flex-col md:flex-row justify-center items-center">
                    <MdSportsTennis className="max-md:mb-1 mr-1 text-xl" />Tennis
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/sportsbook/">
              <div className="relative rounded-lg min-h-[48px] bg-gradient-to-tl animate-gradient-xy from-accent via-amber-500 to-black overflow-hidden shadow-lg border-2 border-white">
                <Image
                  quality={10}
                  className="object-cover object-center opacity-20"
                  src="/img/sportsbook.png"
                  alt=""
                  fill
                />
                <div className="absolute top-0 left-0 flex flex-row items-center justify-center md:justify-start w-full h-full p-2">
                  <div className="text-[0.7rem] text-base font-bold italic tracking-[0.1em] capitalize text-white flex flex-col md:flex-row justify-center items-center">
                    <MdSportsScore className="max-md:mb-1 mr-1 text-xl" />Sportsbook
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Game Buttons */}
          <div className="animate__animated animate__fadeInDown w-full !overflow-x-auto scrollbar-hide">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 px-2 text-left bg-transparent !overflow-x-auto">
              <Link href={`/indian-card-games`}>
                <div className="relative rounded-lg min-h-[32px] md:min-h-[40px] bg-gradient-to-br animate-gradient-xy from-accent via-blue-500 to-black overflow-hidden shadow-lg border-2 border-white">
                  <Image quality={10} className="object-cover object-center opacity-20" src="/img/live-casino.png" alt="" fill />
                  <div className="absolute top-0 left-0 flex flex-row items-center justify-start w-full h-full p-2">
                    <div className="text-base font-bold italic tracking-[0.1em] capitalize text-white flex md:flex-row justify-center items-center">
                      <Image quality={10} className="object-cover object-center opacity-100 mr-1" src="/img/live-casino.png" alt="" width={24} height={24} />
                      Live Casino
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/sportsbook">
                <div className="relative rounded-lg min-h-[32px] md:min-h-[40px] bg-gradient-to-br animate-gradient-xy from-accent via-amber-500 to-black overflow-hidden shadow-lg border-2 border-white">
                  <Image quality={10} className="object-cover object-center opacity-20" src="/img/sportsbook.png" alt="" fill />
                  <div className="absolute top-0 left-0 flex flex-row items-center justify-start w-full h-full p-2">
                    <div className="text-base font-bold italic tracking-[0.1em] capitalize text-white flex md:flex-row justify-center items-center">
                      <Image quality={10} className="object-cover object-center opacity-100 mr-1" src="/img/sportsbook.png" alt="" width={24} height={24} />
                      Sportsbook
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/sportsbook?group=Cricket">
                <div className="relative rounded-lg min-h-[32px] md:min-h-[40px] bg-gradient-to-br animate-gradient-xy from-accent via-green-500 to-black overflow-hidden shadow-lg border-2 border-white">
                  <Image quality={10} className="object-cover object-center opacity-20" src="/img/cricket.png" alt="" fill />
                  <div className="absolute top-0 left-0 flex flex-row items-center justify-start w-full h-full p-2">
                    <div className="text-base font-bold italic tracking-[0.1em] capitalize text-white flex md:flex-row justify-center items-center">
                      <Image quality={10} className="object-cover object-center opacity-100 mr-1" src="/img/cricket.png" alt="" width={24} height={24} />
                      Cricket
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/indian-card-games/">
                <div className="relative rounded-lg min-h-[32px] md:min-h-[40px] bg-gradient-to-br animate-gradient-xy from-accent via-pink-500 to-black overflow-hidden shadow-lg border-2 border-white">
                  <Image quality={10} className="object-cover object-center opacity-20" src="/img/indian-card-games.png" alt="" fill />
                  <div className="absolute top-0 left-0 flex flex-row items-center justify-start w-full h-full p-2">
                    <div className="text-base font-bold italic tracking-[0.1em] capitalize text-white flex md:flex-row justify-center items-center">
                      <Image quality={10} className="object-cover object-center opacity-100 mr-1" src="/img/indian-card-games.png" alt="" width={24} height={24} />
                      Indian Card Games
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="col-span-8 mt-4 px-2 md:px-0">
          {/* <GameProviderGrid title="" showIcon={false} /> */}
          <SportsBook group={[GROUP.CRICKET, GROUP.SOCCER]} />
          <GameGrid title="Indian Card Games" api="fawk" tag={["home"]} />
          {/* <GameGrid title="Popular Games" tag={["popular", "home"]} /> */}
          {/* <GameGrid title="Casino" tag="casino" /> */}
          {/* <GameGrid title="Casino" tag="Lobby" api="wacs" /> */}
          <GameGrid title="Virtual Games" tag="virtual" />
          {/* <GameGrid title="Slot Games" tag="slot" /> */}
        </div>

        <div className="col-span-8 mb-12"></div>
      </div>
    </>
  );
}
