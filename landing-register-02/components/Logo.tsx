import { BsFillSuitSpadeFill } from 'react-icons/bs'

interface LogoProps {
    dark?: boolean;
    size?: string;
}

const Logo: React.FC<LogoProps> = ({
    dark = false,
    size = "3xl", // small = 1xl, medium = 2xl, large = 3xl, x-large = 4xl
}) => {
    return (
        <div className={`flex flex-row text-center justify-center items-center ${size == '5xl' ? `text-5xl` : size == '4xl' ? `text-4xl` : size == '3xl' ? `text-3xl` : size == '2xl' ? 'text-2xl' : size == 'xl' ? 'text-xl' : 'text-2xl'} ${dark ? 'text-black' : 'text-white'}`}>
            <div className="flex flex-row justify-center items-center">
                <BsFillSuitSpadeFill className="mr-1" />
                <div className="font-black">SPADE</div>
                <div className="font-thin">365</div>
            </div>
        </div>
    )
}

export default Logo