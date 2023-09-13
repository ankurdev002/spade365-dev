import { AiOutlineLoading3Quarters } from "react-icons/ai"
import Marquee from "react-fast-marquee";
import Logo from "./Logo"

interface LoaderBGProps {
    showLogo?: boolean;
    children?: React.ReactNode;
}

const LoaderBG: React.FC<LoaderBGProps> = ({
    showLogo = true,
    children
}) => {
    return (
        <>
            <div id={showLogo ? 'preloader' : ''} className="fixed flex flex-col justify-center items-center w-screen top-0 left-0 h-[120vh] text-white break-words bg-gradient-to-r from-secondary to-primary z-50" >
                <div className='splash-screen'>
                    {/* <IonImg src='assets/img/splash-bg.png' className='splash-bg'></IonImg> */}
                    <div className="splash-typo splash-bg opacity-40">
                        <div className="splash-typo-container">
                            <Marquee direction={"left"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-16%' }}>
                                    <span className="text-blue">SPADE365</span>
                                    <span className="text-green">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"right"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-22.5rem' }}>
                                    <span className="text-purple">SPADE365</span>
                                    <span className="text-yellow">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"left"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-12.5rem' }}>
                                    <span className="text-yellow">SPADE365</span>
                                    <span className="text-purple">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"right"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-32rem' }}>
                                    <span className="text-green">SPADE365</span>
                                    <span className="text-blue">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"left"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-14rem' }}>
                                    <span className="text-blue">SPADE365</span>
                                    <span className="text-green">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"right"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-30rem' }}>
                                    <span className="text-yellow">SPADE365</span>
                                    <span className="text-purple">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"left"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-16rem' }}>
                                    <span className="text-blue">SPADE365</span>
                                    <span className="text-green">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"right"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-22.5rem' }}>
                                    <span className="text-purple">SPADE365</span>
                                    <span className="text-yellow">SPADE365</span>
                                </h1>
                            </Marquee>
                            <Marquee direction={"left"} speed={140} gradient={false}>
                                <h1 className="overflow-hidden" style={{ marginLeft: '-12.5rem' }}>
                                    <span className="text-yellow">SPADE365</span>
                                    <span className="text-purple">SPADE365</span>
                                </h1>
                            </Marquee>
                        </div>
                    </div>
                    <div className='splash-inner flex items-center justify-center flex-col -mt-56 not-italic'>
                        {showLogo &&
                            <>
                                <Logo size="5xl" />
                                <AiOutlineLoading3Quarters className="animate-spin text-6xl mt-8" />
                            </>
                        }
                        {children}
                    </div>
                </div>

            </div>
        </>
    )
}

export default LoaderBG