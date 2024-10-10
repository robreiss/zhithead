import { useInterpret } from "@xstate/react";
import { createContext, PropsWithChildren, useEffect } from "react";
import { InterpreterFrom } from "xstate";
import { zhitheadMachine } from "../../state/machines/zhithead.machine";

export const GlobalStateContext = createContext({
  zhitheadService: {} as InterpreterFrom<typeof zhitheadMachine>,
});

// Add this type declaration to extend the Window interface
declare global {
  interface Window {
    zhitheadService?: InterpreterFrom<typeof zhitheadMachine>;
  }
}

export default function GlobalStateProvider(props: PropsWithChildren) {
  const zhitheadService = useInterpret(zhitheadMachine);

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
