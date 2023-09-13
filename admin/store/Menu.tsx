import { createContext, ReactElement, useState } from "react";

type Store = {
  menuOpen: boolean;
  sideMenuOpen: boolean;
  toggleMenuOpen: () => void;
  toggleSideMenuOpen: () => void;
};

export const MenuStore = createContext<Store>({
  menuOpen: false,
  toggleMenuOpen: () => {},
  toggleSideMenuOpen: () => {},
  sideMenuOpen: false,
});

export default function MenuStoreProvider({
  children,
}: {
  children: ReactElement;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const toggleMenuOpen = () => setMenuOpen((s) => !s);
  const toggleSideMenuOpen = () => setSideMenuOpen((s) => !s);

  const value: Store = {
    menuOpen,
    toggleMenuOpen,
    sideMenuOpen,
    toggleSideMenuOpen,
  };

  return <MenuStore.Provider value={value}>{children}</MenuStore.Provider>;
}
