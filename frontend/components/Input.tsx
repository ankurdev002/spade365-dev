import { ChangeEvent, useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
type Props = {
  prefix?: string;
  placeholder: string;
  value: string;
  type: string;
  maxLength?: number;
  className?: string;
  id: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function Input(props: Props) {
  const {
    prefix,
    placeholder,
    value,
    onChange,
    type,
    maxLength,
    className,
    id,
  } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function togglePasswordVisibility() {
    if (inputRef === null || inputRef.current === null) return;
    if (inputRef.current.type === "password") {
      inputRef.current.type = "text";
      setIsPasswordVisible(true);
    } else {
      inputRef.current.type = "password";
      setIsPasswordVisible(false);
    }
  }

  return (
    <div>
      <div
        className={
          " h-14 relative group border-b-2 border-b-secondary focus-within:border-white " +
          className ?? ""
        }
      >
        {/* label */}
        {/* <label
          htmlFor={id}
          className={`absolute bottom-1/4 select-none block cursor-text group-focus-within:opacity-0 text-white ${
            prefix ? "left-12" : "left-3"
          }`}
        >
          {value ? "" : placeholder}
        </label> */}
        {/* prefix */}
        {!!prefix && (
          <div className="absolute left-0 bottom-0 w-12 h-full grid place-items-center text-white">
            {prefix}
          </div>
        )}
        {/* input container */}
        <div className="absolute inset-0 w-full grid grid-cols-[1fr,max-content]">
          <input
            ref={inputRef}
            id={id}
            type={type}
            placeholder={placeholder}
            autoComplete="new-field" // disable chrome autofill
            className={`block border-0 focus:ring-0 outline-none bg-transparent w-full text-white placeholder-white/50 ${prefix ? "pl-12" : ""
              }`}
            value={value}
            onChange={(e) =>
              maxLength && e.target.value.length > maxLength
                ? undefined
                : onChange(e)
            }
          />

          {/* show password */}
          {type === "password" && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-0 bottom-0 w-12 h-full grid place-items-center"
            >
              {isPasswordVisible ? (
                <FiEyeOff className="h-6 w-6 text-white" />
              ) : (
                <FiEye className="h-6 w-6 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
      {maxLength && (
        <p className="text-end text-xs mt-1 text-gray-300">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
