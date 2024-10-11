import {
  createContext,
  PropsWithChildren,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

const breakpoints = ["sm", "md", "lg", "xl", "2xl"] as const;
type Breakpoint = (typeof breakpoints)[number];

interface BreakpointsContext {
  (breakpoint: Breakpoint): boolean;
}

export const BreakpointsContext = createContext<BreakpointsContext>(
  {} as BreakpointsContext,
);

export default function BreakpointsProvider(props: PropsWithChildren) {
  const [width, setWidth] = useState(window.innerWidth);
  const [, startTransition] = useTransition();

  useEffect(() => {
    function onResize() {
      startTransition(() => {
        setWidth(window.innerWidth);
      });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Declare refs at the top level
  const refSm = useRef<HTMLDivElement>(null);
  const refMd = useRef<HTMLDivElement>(null);
  const refLg = useRef<HTMLDivElement>(null);
  const refXl = useRef<HTMLDivElement>(null);
  const ref2xl = useRef<HTMLDivElement>(null);

  const refs = useMemo(
    () => ({
      sm: refSm,
      md: refMd,
      lg: refLg,
      xl: refXl,
      "2xl": ref2xl,
    }),
    [refSm, refMd, refLg, refXl, ref2xl],
  );
  const isVisible = useCallback(
    (el?: HTMLElement | null) => !!el?.offsetParent,
    [],
  );

  const deferredWidth = useDeferredValue(width);
  const isBreakpoint = useCallback(
    (breakpoint: Breakpoint) => {
      return isVisible(refs[breakpoint].current);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVisible, deferredWidth, refs],
  );

  return (
    <BreakpointsContext.Provider value={isBreakpoint}>
      {breakpoints.map((bp) => (
        <div
          key={bp}
          ref={refs[bp]}
          className={`hidden h-0 w-0 ${bp === "sm" ? "" : "sm:hidden"} ${
            bp === "md" ? "md:block" : "md:hidden"
          } ${bp === "lg" ? "lg:block" : "lg:hidden"} ${
            bp === "xl" ? "xl:block" : "xl:hidden"
          } ${bp === "2xl" ? "2xl:block" : "2xl:hidden"}`}
        />
      ))}
      {props.children}
    </BreakpointsContext.Provider>
  );
}
