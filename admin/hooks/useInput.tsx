import { ChangeEvent, useState } from "react";

export default function useInput(initial: string) {
  const [value, setValue] = useState(initial);

  const updateHandler = (value: string) => setValue(value);

  const reset = (value?: string) => {
    setValue(value ?? "");
  };

  return {
    value,
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      updateHandler(e.target.value),
    reset,
  };
}
