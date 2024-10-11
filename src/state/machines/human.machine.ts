import { ActorRef, Snapshot, sendTo, setup } from "xstate";
import { Card, Pile, Player } from "../../lib";

type PlayerEvents =
  | { type: "CARD_CHOSEN"; card?: Card; n?: number }
  | { type: "ASK_PICK_CARD"; pile: Pile; player: Player };

type ParentActor = ActorRef<Snapshot<unknown>, PlayerEvents>;

const humanMachine = setup({
  types: {
    context: {} as {
      parentRef: ParentActor;
    },
    input: {} as {
      parentRef: ParentActor;
    },
  },
}).createMachine({
  context: ({ input: { parentRef } }) => ({ parentRef }),
  id: "human",
  initial: "idle",
  states: {
    idle: {
      on: {
        ASK_PICK_CARD: { target: "waitingForHuman" },
        "*": {
          actions: ({ event }) => {
            console.log(`Ignored event in idle state: ${event.type}`);
          },
        },
      },
    },
    waitingForHuman: {
      on: {
        CHOOSE_CARD: {
          actions: sendTo(
            ({ context }) => context.parentRef,
            ({ event }) => {
              if (event.type === "CHOOSE_CARD") {
                return {
                  type: "CARD_CHOSEN",
                  card: event.card,
                  n: event.n,
                } as const;
              }
              throw new Error(`Unexpected event type: ${event.type}`);
            },
          ),
          target: "idle",
        },
      },
    },
  },
});

export default humanMachine;
