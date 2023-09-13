import { FaArrowDown, FaArrowUp } from "react-icons/fa";

interface BetContainerProps {
    name: string,
    value: string,
    handleOnClick: Function,
    show: boolean
}

export default function BetContainer(props: BetContainerProps) {
    return (
        <div className="flex flex-col my-2">
            <div className="flex bg-primary p-2 text-white text-sm" onClick={() => props.handleOnClick()}>{props.name}
                <span className="ml-auto">{props.show ? <FaArrowDown /> : <FaArrowUp />}</span>
            </div>
            {props.show && <div className="bg-white p-2 text-sm">{props.value}</div>}
        </div>
    )
}
