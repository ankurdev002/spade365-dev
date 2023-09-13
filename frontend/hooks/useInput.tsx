import { ChangeEvent, useState } from "react";

export default function useInput<T = string | number>(initial: T) {
  const [value, setValue] = useState(initial);

  const updateHandler = (value: T) => setValue(value);

  const reset = (value: T) => {
    setValue(value);
  };

  return {
    value,
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      updateHandler(e.target.value as T),
    reset,
  };
}
