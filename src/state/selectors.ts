import { StateFrom } from "xstate";
import { zhitheadMachine } from "../state/machines/zhithead.machine";

type Selector<T> = (state: StateFrom<typeof zhitheadMachine>) => T;

export const isChoosingFaceUpCardsStor: Selector<boolean> = (state) =>
  state.matches("choosingFaceUpCards" as never);

export const isPlayingStor: Selector<boolean> = (state) =>
  state.matches("playing" as never);

export const isGameOverStor: Selector<boolean> = (state) =>
  state.matches("won" as never) || state.matches("lost" as never);

export const hasWonStor: Selector<boolean> = (state) =>
  state.matches("won" as never);
export const hasLostStor: Selector<boolean> = (state) =>
  state.matches("lost" as never);
