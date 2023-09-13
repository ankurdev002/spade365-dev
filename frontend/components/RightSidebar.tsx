import { useState } from "react";
import AvailableCredit from "../components/AvailableCredit";
import BetContainer from "../components/BetContainer";
import useUser from "../hooks/useUser";

export default function RightSidebar() {
    const [matchedBets, setMatchedBets] = useState(true);
    const [openBets, setOpenBets] = useState(false);
    const { isLoggedIn } = useUser();
    return (
        <>
            {/* Available Credits */}
            <div className="hidden md:block py-2">
                {isLoggedIn && (
                    <div className="w-full">
                        <AvailableCredit />
                    </div>
                )}

                <div>
                    <div className="border-b border-grey text-sm text-grey py-2">Betslip</div>
                    <div className="my-3">
                        <div className="flex">
                            <div className={`text-sm px-3 py-1 cursor-pointer ${!openBets ? 'bg-white' : 'bg-lightGrey1'}`} onClick={() => setOpenBets(false)}>Betslip</div>
                            <div className={`text-sm px-3 py-1 cursor-pointer ${openBets ? 'bg-white' : 'bg-lightGrey1'}`} onClick={() => setOpenBets(true)}>Open bets</div>
                        </div>
                        <div className="bg-white">
                            {!openBets && <div className="text-xs p-3">Click on the odds to add selections to the betslip.</div>}
                            {openBets && <div className="p-2">
                                <BetContainer name={'Unmatched Bet'} value={'You have no unmatched bets'} handleOnClick={() => setMatchedBets(!matchedBets)} show={!matchedBets} />
                                <BetContainer name={'Matched Bet'} value={'You have no matched bets'} handleOnClick={() => setMatchedBets(!matchedBets)} show={matchedBets} />
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
