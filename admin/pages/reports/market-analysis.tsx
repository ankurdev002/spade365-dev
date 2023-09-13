import Head from "next/head";
import { useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { BiFootball } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import { GiHorseHead, GiTennisRacket } from "react-icons/gi";
import { MdSportsCricket } from "react-icons/md";

export default function MarketAnalysis() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");

  const updateActive = (value: string) => setActive(value.toLowerCase());

  const isActive = (value: string) =>
    value.toLowerCase() === active.toLowerCase();

  const games = [
    { icon: MdSportsCricket, label: "Cricket" },
    { icon: BiFootball, label: "Football" },
    { icon: GiTennisRacket, label: "Tennis" },
    { icon: GiHorseHead, label: "Horse Racing" },
  ];

  return (
    <>
      <Head>
        <title>Market Risk Analysis | Spade365</title>
        <meta name="description" content="Market Risk Analysis | Spade365" />
      </Head>
      <div className="flex flex-col justify-start items-center min-h-[800px] w-full mx-auto overflow-hidden">
        {/* search header */}
        <div className="flex flex-col md:flex-row justify-between w-full items-center mb-8 md:mb-4">
          <h1 className="text-center md:text-left text-4xl lg:text-5xl my-6 w-1/2">
            Market Risk Analysis
          </h1>
          {/* search */}
          <div className="flex flex-row justify-center md:justify-start items-center w-full md:w-1/2">
            {/* search inpout with search icon */}
            <div className="md:ml-auto flex flex-row justify-start items-center w-full bg-gray rounded-md border max-w-xs">
              <button className="p-2 h-full rounded-md">
                <AiOutlineSearch className="text-2xl" />
              </button>
              <input
                type="search"
                className="w-full p-2 focus:outline-none focus:ring-0 border-none bg-transparent"
                placeholder="Search"
                autoComplete="new-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* button to add user */}
            {/* <button
              className="ml-4 p-2 bg-white text-black rounded-md flex flex-row justify-center items-center"
              title="Add User"
              onClick={() => {
                // setModalUser(emptyUser);
                // setShowTeamModal(true);
              }}
            >
              <IoIosPersonAdd className="text-2xl" />
              <span className="ml-1 hidden lg:inline-block">Add Admin</span>
            </button> */}
          </div>
        </div>

        {/* main content */}
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
          {games.map((game) => (
            <button
              key={game.label}
              className={`relative border-2 flex items-center backdrop-blur-sm bg-primary/20 px-8 py-3 rounded-lg ${isActive(game.label)
                ? "border-secondary"
                : "opacity-40 hover:opacity-100  border-transparent"
                }`}
              onClick={() => updateActive(game.label)}
            >
              {/* tick */}
              {isActive(game.label) && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-700 p-4 rounded-full z-10">
                  <FiCheck className="w-6 h-6" />
                </div>
              )}
              <game.icon className="text-8xl opacity-50" />
              <p className="text-xl ml-5">{game.label}</p>
            </button>
          ))}
        </main>
      </div>
    </>
  );
}
