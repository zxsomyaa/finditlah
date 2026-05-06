/**
 * Preserves the last visited full path (including query/hash) for each main tab.
 * MobileNav reads from this to "return to last location" instead of always going to the root.
 */
import { createContext, useContext, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

const TAB_ROOTS = ["/", "/map", "/post", "/chats", "/profile"];

const TabNavContext = createContext({ lastPaths: { current: {} } });

export function TabNavigationProvider({ children }) {
  const lastPaths = useRef({});
  return (
    <TabNavContext.Provider value={{ lastPaths }}>
      {children}
    </TabNavContext.Provider>
  );
}

/** Call inside any tab page to keep lastPaths up-to-date. */
export function useRecordTabPath() {
  const { lastPaths } = useContext(TabNavContext);
  const location = useLocation();

  useEffect(() => {
    const root = TAB_ROOTS.find(
      (r) => r === "/" ? location.pathname === "/" : location.pathname.startsWith(r)
    );
    if (root) {
      lastPaths.current[root] = location.pathname + location.search + location.hash;
    }
  });
}

export function useLastTabPath(tabRoot) {
  const { lastPaths } = useContext(TabNavContext);
  return lastPaths.current[tabRoot] ?? tabRoot;
}

export { TAB_ROOTS };