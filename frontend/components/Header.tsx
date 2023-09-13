import Logo from "./Logo";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoCloseCircleOutline } from "react-icons/io5";
import { FiUser } from "react-icons/fi";
import LoginModal from "./LoginModal";
import { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { MenuStore } from "../store/Menu";
import Marquee from "react-fast-marquee";
import { Action } from "./LoginModal";
import useUser from "../hooks/useUser";
import useSiteContext from "../hooks/useSiteContext";
import { BsSearch } from "react-icons/bs";
import useGames from "../hooks/useGames";
import { Game } from "../store/Games";
import { MdSportsCricket, MdSportsScore } from "react-icons/md";
import { AiFillVideoCamera } from "react-icons/ai";
import { BiFootball } from "react-icons/bi";

const Header = () => {
  const gamesList = useGames();
  const [loginVisibile, setLoginVisible] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([] as Game[]); // search results
  const { toggleMenuOpen, toggleSideMenuOpen } = useContext(MenuStore);
  const [activeLoginTab, setActiveLoginTab] = useState("login");
  const { isLoggedIn, user, logout } = useUser();
  const siteContext = useSiteContext();

  const searchGames = (search: string) => {
    // search in gamesList.games
    const games = gamesList.games.filter((game) => game.name.toLowerCase().includes(search.toLowerCase()));
    setSearchResults(games);
  };

  // search in games context when search changes
  useEffect(() => {
    if (search.length > 0) {
      searchGames(search);
    }
  }, [search]);

  return (
    <div className="z-2">
      {(siteContext.notices.loggedIn.text && isLoggedIn) && (
        <Marquee
          gradient={false}
          speed={40}
          className="bg-secondary text-neutral"
        >
          <p className="pl-8 text-xs tracking-wider uppercase py-2">
            {siteContext.notices.loggedIn.text}
          </p>
        </Marquee>
      )}
      {(siteContext.notices.loggedOut.text && !isLoggedIn) && (
        <Marquee
          gradient={false}
          speed={40}
          className="bg-secondary text-neutral"
        >
          <p className="pl-8 text-xs tracking-wider uppercase py-2">
            {siteContext.notices.loggedOut.text}
          </p>
        </Marquee>
      )}
      <div className="w-full text-white break-words bg-gradient-to-l from-primary via-primary to-accent shadow-lg">
        <div className="relative flex justify-between items-center py-2 px-2 lg:px-0 text-white break-words sm:mx-auto sm:my-0 sm:w-full container">
          {/* mobile search */}
          {showSearch && (
            <>
              <div className="absolute top-0 left-0 w-full h-full bg-primary z-10 flex items-center justify-center sm:hidden">
                <BsSearch
                  className="text-xl sm:text-base text-white/70 sm:text-black/50 z-1 -mr-10"
                />
                <input
                  type="search"
                  autoComplete="new-search"
                  className="w-[80%] h-[90%] rounded bg-transparent text-white text-base pl-12 pr-4 py-2 focus:outline-none placeholder:text-white/70 border-white/50 focus:border-white"
                  placeholder="Search Games &amp; Events"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <IoCloseCircleOutline
                  className="absolute right-4 text-4xl text-white/80 z-1 cursor-pointer"
                  title="Clear Search"
                  onClick={() => {
                    setShowSearch(false)
                    setSearch("")
                    setSearchResults([])
                  }} />
              </div>
              {search.length > 0 && (
                <div className="sm:hidden absolute top-14 -left-4 right-0 z-10 overflow-y-scroll mx-auto w-full max-w-[80%] md:max-w-md max-h-96 bg-white rounded shadow-lg">
                  {searchResults.map((game) => (
                    <Link
                      href={`/game/${game.id}`}
                      key={game.id}
                      title={`Play ${game.name} Online in India at Spade365`}
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setSearch("");
                        setSearchResults([]);
                        setShowSearch(false);
                      }}
                    >
                      <p className="text-xs capitalize text-black">{game.name}</p>
                      <small className="text-[0.5rem] text-gray-500 capitalize">{game.provider}</small>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="text-white flex flex-row justify-center items-center">
            <div className="mr-6 text-2xl cursor-pointer grid place-items-center">
              {/* side menu btn */}
              <button className="cursor-pointer" onClick={toggleMenuOpen}>
                <GiHamburgerMenu />
              </button>
            </div>
            <div className="w-36">
              <Link href="/" title="Spade365">
                <Logo size="2xl" />
              </Link>
            </div>
          </div>
          <div className="flex text-black break-words">
            <div className="flex items-center justify-center mr-3 md:mr-6 relative">
              {/* desktop search */}
              <div className="relative flex items-center justify-center">
                <BsSearch
                  className="text-2xl sm:text-base text-white sm:text-black/50 sm:-mr-6 z-1"
                  onClick={() => setShowSearch(!showSearch)}
                />
                <input
                  type="text"
                  className="hidden sm:block w-56 h-full rounded bg-white text-black text-xs pl-8 pr-4 py-3 focus:outline-none"
                  placeholder="Search Games &amp; Events"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search.length > 0 && (
                  <IoCloseCircleOutline
                    className="hidden sm:block absolute right-2 text-2xl text-black/50 z-1 cursor-pointer"
                    title="Clear Search"
                    onClick={() => {
                      setSearch("")
                      setSearchResults([])
                    }} />
                )}
              </div>
              {/* search results */}
              {search.length > 0 && (
                <div className="hidden sm:block absolute top-12 -left-2 z-10 overflow-y-scroll w-56 max-h-96 bg-white rounded shadow-lg">
                  {searchResults.map((game) => (
                    <Link
                      href={`/game/${game.id}`}
                      key={game.id}
                      title={`Play ${game.name} Online in India at Spade365`}
                      className="block px-4 py-2 hover:bg-gray-100"
                      onClick={() => {
                        setSearch("");
                        setSearchResults([]);
                      }}
                    >
                      <p className="text-xs capitalize text-black">{game.name}</p>
                      <small className="text-[0.5rem] text-gray-500 capitalize">{game.provider}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Login/signup will only be visible if user is not logged in */}
            {!isLoggedIn ? (
              <>
                <button
                  className="flex relative justify-center items-center ml-1 rounded shadow text-base leading-5 text-center break-words cursor-pointer sm:mr-5 bg-secondary px-4 py-3 hover:shadow-lg hover:bg-opacity-80"
                  onClick={() => {
                    setActiveLoginTab("login");
                    setLoginVisible(true);
                  }}
                >
                  Log in
                </button>
                <button
                  className="flex relative justify-center items-center ml-1 rounded shadow text-base leading-5 text-center break-words cursor-pointer sm:mr-5 bg-white px-4 py-3 hover:shadow-lg hover:bg-opacity-80"
                  onClick={() => {
                    setActiveLoginTab("sign up");
                    setLoginVisible(true);
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              // logged in buttons
              <>
                {/* <button
              className="flex relative justify-center items-center ml-1 rounded shadow text-xs leading-5 text-center break-words cursor-pointer sm:mr-5 bg-secondary px-4 py-2 hover:shadow-lg hover:bg-opacity-80"
              onClick={logout}
              >
              Log out
              </button> */}
                <Link href="/user/deposit" title="Deposit">
                  <button className="h-full flex flex-row justify-center items-center ml-1 rounded shadow text-sm leading-5 text-center break-words cursor-pointer sm:mr-5 bg-secondary px-2 py-3 md:px-4 hover:shadow-lg hover:bg-opacity-80">
                    {/* <BsDatabaseFillAdd className="text-xl" /> */}
                    <span>Deposit</span>
                  </button>
                </Link>
                <Link href="/user/withdraw" title="Withdraw">
                  <button className="h-full flex flex-row justify-center items-center ml-1 rounded shadow text-sm leading-5 text-center break-words cursor-pointer sm:mr-5 bg-white px-2 py-3 md:px-4 hover:shadow-lg hover:bg-opacity-80">
                    {/* <BsCashStack className="text-xl" /> */}
                    <span>Withdraw</span>
                  </button>
                </Link>
              </>
            )}

            {/* if user has admin role, show visit admin button */}
            {/* {user?.is_superuser && (
              <Link
                href={"/team/deposits"}
                className="flex relative justify-center items-center ml-1 rounded shadow text-xs leading-5 text-center break-words cursor-pointer sm:mr-5 bg-accent px-4 text-white py-2 hover:shadow-lg hover:bg-opacity-80"
              >
                Visit Admin <AiOutlineArrowRight className="ml-2" />
              </Link>
            )} */}

            {/* if user is logged in show user menu */}
            {isLoggedIn && (
              <button
                className="flex flex-row relative justify-center items-center ml-1 rounded shadow text-xs leading-5 text-center break-words cursor-pointer sm:mr-5 bg-white px-4 py-2 hover:shadow-lg hover:bg-opacity-80"
                onClick={toggleSideMenuOpen}
              >
                <FiUser className="w-5 h-5" />
                {!!user?.credit && (
                  <span className="text-xs text-black ml-1">
                    {"₹ "}
                    {user?.credit > 1000 && user?.credit < 100000
                      ? `${(user?.credit / 1000).toFixed(1)}K`
                      : user?.credit > 100000 && user?.credit < 10000000
                        ? `${(user?.credit / 100000).toFixed(2)}L`
                        : user?.credit > 10000000
                          ? `${(user?.credit / 10000000).toFixed(2)}C`
                          : user?.credit}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="animate__animated animate__fadeInDown text-white text-center bg-gradient-to-b from-[#2e2d2d] to-black break-words shadow-lg w-full overflow-x-scroll scrollbar-hide">
        <div className="grid grid-cols-4 py-2 my-0 mx-auto container break-words leading-6 uppercase">
          <Link
            href="/sportsbook?group=Cricket"
            className="text-white hover:text-secondary relative cursor-pointer col-span-1 text-sm flex flex-col justify-center items-center"
          >
            <MdSportsCricket className="text-xl text-secondary lg:hidden mb-1" />
            Cricket
          </Link>
          <Link
            href="/sportsbook?group=Soccer"
            className="text-white hover:text-secondary relative cursor-pointer col-span-1 text-sm flex flex-col justify-center items-center"
          >
            <BiFootball className="text-xl text-secondary lg:hidden mb-1" />
            Football
          </Link>
          <Link
            href="/sportsbook"
            className="text-white hover:text-secondary relative cursor-pointer col-span-1 text-sm flex flex-col justify-center items-center"
          >
            <MdSportsScore className="text-xl text-secondary lg:hidden mb-1" />
            Sportsbook
          </Link>
          <Link
            href="/indian-card-games"
            className="relative cursor-pointer text-white hover:text-secondary col-span-1 text-sm flex flex-col justify-center items-center"
          >
            <AiFillVideoCamera className="text-xl text-secondary lg:hidden mb-1" />
            Live Casino
          </Link>
        </div>
      </div>
      {loginVisibile && (
        <LoginModal
          isOpen={loginVisibile}
          closeModal={() => setLoginVisible(false)}
          active={activeLoginTab as Action}
        />
      )}
    </div>
  );
};

export default Header;
