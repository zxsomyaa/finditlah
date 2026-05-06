import { createContext, useContext, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollContext = createContext({});

// Routes whose scroll positions should be preserved when switching tabs
const PRESERVED_ROUTES = ["/", "/map", "/chats", "/profile"];

export function ScrollPreservationProvider({ children }) {
  const scrollPositions = useRef({});
  return (
    <ScrollContext.Provider value={scrollPositions}>
      {children}
    </ScrollContext.Provider>
  );
}

// Call inside a page to auto-save/restore its scroll position
export function useScrollPreservation() {
  const scrollPositions = useContext(ScrollContext);
  const location = useLocation();
  const key = location.pathname;
  const shouldPreserve = PRESERVED_ROUTES.includes(key);

  useEffect(() => {
    if (!shouldPreserve) return;

    // Restore saved position
    const saved = scrollPositions.current[key] ?? 0;
    window.scrollTo({ top: saved, behavior: "instant" });

    // Save position on unmount
    return () => {
      scrollPositions.current[key] = window.scrollY;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}