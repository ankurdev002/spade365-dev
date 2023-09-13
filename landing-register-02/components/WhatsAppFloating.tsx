import Link from "next/link";
import { useEffect, useState } from "react";
import { BsWhatsapp } from "react-icons/bs";
import useSiteContext from "../hooks/useSiteContext";

export default function WhatsAppFloating() {
    const [hidden, setHidden] = useState(1);
    const site = useSiteContext();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setHidden(0);
        }, 5000);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setHidden(1);
        }, 13000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="fixed bottom-0 right-0 m-4 z-10">
            <Link
                href={`https://wa.me/${site.whatsapp_number}?text=Hi%20I%20want%20to%20get%20new%20ID`}
                target="_blank" rel="noreferrer">
                <div className="bg-green-500 text-white rounded-full p-3 flex flex-row items-center justify-center transition-all">
                    <BsWhatsapp className="text-4xl" />
                    <div className={`text-sm transition-all ml-2 ${hidden ? "hidden" : ""}`}>Get New ID<br />on WhatsApp</div>
                </div>
            </Link>
        </div>
    )
}