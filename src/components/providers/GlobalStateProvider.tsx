import { createContext, PropsWithChildren, useEffect } from "react";
import { AnyActorRef, createActor } from "xstate";
import { zhitheadMachine } from "../../state/machines/zhithead.machine";

export const GlobalStateContext = createContext({
  zhitheadService: {} as AnyActorRef,
});

// Add this type declaration to extend the Window interface
declare global {
  interface Window {
    zhitheadService?: AnyActorRef;
  }
}

export default function GlobalStateProvider(props: PropsWithChildren) {
  const zhitheadService = createActor(zhitheadMachine).start();

  useEffect(() => {
    // Attach zhitheadService to the window object
    window.zhitheadService = zhitheadService;

    // Cleanup function to remove the global variable when the component unmounts
    return () => {
      delete window.zhitheadService;
    };
  }, [zhitheadService]);

  return (
    <GlobalStateContext.Provider value={{ zhitheadService }}>
      {props.children}
    </GlobalStateContext.Provider>
  );
}
