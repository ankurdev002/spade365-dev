import { useEffect, useState } from "react";
import useUser from "../hooks/useUser";

export default function AvailableCredit() {
    const { user } = useUser();
    const [winnings, setWinnings] = useState(0);

    // call api to get user winnings
    const getUserWinnings = async () => {
        try {
            const options = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            };
            const res = await fetch('/api/bets/winnings/', options);
            if (res.status === 200) {
                const data = await res.json();
                setWinnings(data.winnings);
            }
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getUserWinnings();
    }, []);

    return (
        <>
            <div className="bg-primary border border-primary text-white px-2">Available Credits</div>
            <div className="border border-black bg-white px-2">
                <div><span className="text-sm font-bold">Credit Limit:</span> <span className="text-sm">&#8377; 20,00,000</span></div>
                <div><span className="text-sm font-bold">Winnings:</span> <span className="text-sm">&#8377; {winnings || 0}</span></div>
                <div><span className="text-sm font-bold">Available Balance:</span> <span className="text-sm">&#8377; {user?.credit?.toLocaleString()}</span></div>
                <div><span className="text-sm font-bold">Total Net Explosure:</span> <span className="text-sm">&#8377; {user?.exposure?.toLocaleString()}</span></div>
            </div>
        </>
    )
}
