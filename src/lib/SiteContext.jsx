import { createContext, useContext, useEffect, useState } from "react";

/**
 * Site-wide UI state:
 *  - mode: "l" (Lost & Found, cream) or "t" (Thrift, palest blush). Drives the colour band.
 *  - help: which "Learn more" panel is open ("thrift" | "post" | "safety" | null).
 */
const SiteContext = createContext(/** @type {any} */ (null));

export function SiteProvider({ children }) {
  const [mode, setMode] = useState("l");
  const [help, setHelp] = useState(/** @type {string | null} */ (null));
  return (
    <SiteContext.Provider value={{ mode, setMode, help, openHelp: setHelp, closeHelp: () => setHelp(null) }}>
      {children}
    </SiteContext.Provider>
  );
}

export const useSite = () => useContext(SiteContext);

/** Set the colour mode for the current page. @param {"l"|"t"} m */
export function usePageMode(m) {
  const { setMode } = useSite();
  useEffect(() => {
    setMode(m);
  }, [m, setMode]);
}

/** Tailwind classes for the colour band. @param {"l"|"t"} mode */
export const bandClass = (mode) =>
  mode === "t" ? "bg-blush text-rosewood" : "bg-cream text-ink";
