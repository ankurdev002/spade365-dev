import Head from "next/head";
import { useState } from "react";

export default function Settings() {

  const [casinoStakes, setCasinoStakes] = useState({
    one: 1000,
    two: 2000,
    three: 3000,
  });
  const [stakes, setStakes] = useState({
    one: 1000,
    two: 2000,
    three: 3000,
  });

  const handleCasinoStakesUpdate = (e: any) => {
    e.preventDefault();
    // TODO: update casino stakes in the backend
  }

  const handleStakesUpdate = (e: any) => {
    e.preventDefault();
    // TODO: update stakes in the backend
  }

  return (
    <>
      <Head>
        <title>Settings | Spade365</title>
        <meta name="description" content="Settings | Spade365" />
      </Head>
      <div className="text-black bg-white px-6 py-12 break-words w-full max-w-7xl mx-auto">
        <h2 className="text-center text-5xl">Settings</h2>

        <div className="flex flex-col max-w-5xl mx-auto w-full mt-8">

          {/* Edit Casino Stakes */}
          <form className="flex flex-col w-full" onSubmit={(e) => handleCasinoStakesUpdate(e)}>
            <h3 className="text-2xl my-6">Edit Casino Stakes</h3>
            <div className="grid grid-cols-3 gap-2">
              {/* 3 number inputs with value 1000,2000,3000, that can be edited and clicked by button Edit and save */}
              <div className="flex flex-col">
                {/* <label>Min</label> */}
                <input
                  name="casino-1"
                  type="number"
                  className="focus:ring-secondary focus:border-secondary"
                  value={casinoStakes.one}
                  onChange={(e) => setCasinoStakes({ ...casinoStakes, one: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex flex-col">
                {/* <label>Max</label> */}
                <input
                  name="casino-2"
                  type="number"
                  className="focus:ring-secondary focus:border-secondary"
                  value={casinoStakes.two}
                  onChange={(e) => setCasinoStakes({ ...casinoStakes, two: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex flex-col">
                {/* <label>Step</label> */}
                <input
                  name="casino-3"
                  type="number"
                  className="focus:ring-secondary focus:border-secondary"
                  value={casinoStakes.three}
                  onChange={(e) => setCasinoStakes({ ...casinoStakes, three: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button type="submit" className="bg-accent text-white p-3 hover:bg-accent/80">
                Save Changes
              </button>
            </div>
          </form>

          {/* Edit Stakes */}
          <form className="flex flex-col w-full" onSubmit={(e) => handleStakesUpdate(e)}>
            <h3 className="text-2xl my-6">Edit Stakes</h3>
            <div className="grid grid-cols-3 gap-2">
              {/* 3 number inputs with value 1000,2000,3000, that can be edited and clicked by button Edit and save */}
              <div className="flex flex-col">
                {/* <label>Min</label> */}
                <input
                  name="stake-1"
                  type="number"
                  className="focus:ring-secondary focus:border-secondary"
                  value={stakes.one}
                  onChange={(e) => setStakes({ ...stakes, one: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex flex-col">
                {/* <label>Max</label> */}
                <input
                  name="stake-2"
                  type="number"
                  className="focus:ring-secondary focus:border-secondary"
                  value={stakes.two}
                  onChange={(e) => setStakes({ ...stakes, two: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex flex-col">
                {/* <label>Step</label> */}
                <input
                  name="stake-3"
                  type="number"
                  className="focus:ring-secondary focus:border-secondary"
                  value={stakes.three}
                  onChange={(e) => setStakes({ ...stakes, three: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button type="submit" className="bg-accent text-white p-3 hover:bg-accent/80">
                Save Changes
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  )
}