import { useEffect } from "react"
import Image from "next/image"
// import Logo from "../public/spade.png"
import LoaderBG from "./LoaderBG";
const Loader = () => {
    useEffect(() => {
        const preloader = document.getElementById("preloader");
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add("fade-out");
            }, 1000);
            setTimeout(() => {
                // set display none to preloader
                preloader.style.display = "none";
            }, 2000);
        }
    }, []);

    return (
        <>
            <LoaderBG showLogo={true} />
        </>
    )
}

export default Loader