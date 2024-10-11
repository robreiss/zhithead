import { ActorRef, Snapshot, sendTo, setup } from "xstate";
import { bot } from "../../bot";
import { Card, Pile, Player } from "../../lib";

const MIN_DELAY = 450;
const MAX_DELAY = 750;

type PlayerEvents =
  | { type: "CARD_CHOSEN"; card?: Card; n?: number }
  | { type: "ASK_PICK_CARD"; pile: Pile; player: Player };

type ParentActor = ActorRef<Snapshot<unknown>, PlayerEvents>;

const botMachine = setup({
  types: {
    context: {} as {
      parentRef: ParentActor;
    },
    input: {} as {
      parentRef: ParentActor;
    },
  },
  actions: {
    chooseCard: ({ event }) => {
      const chosenCard = bot(event.pile, event.player);
      return sendTo("parent", {
        type: "CARD_CHOSEN",
        card: chosenCard,
        n: undefined,
      });
    },
  },
  delays: {
    DELAY: () =>
      MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)),
  },
}).createMachine({
  context: ({ input: { parentRef } }) => ({ parentRef }),
  id: "bot",
  initial: "idle",
  states: {
    idle: {
      on: {
        ASK_PICK_CARD: { target: "thinking" },
      },
    },
    thinking: {
      after: {
        DELAY: {
          target: "choosing",
          actions: "chooseCard",
        },
      },
    },
    choosing: {
      type: "final",
    },
  },
});

export default botMachine;

// export const createBotMachine = (context: ZhitheadContext) =>
//   createMachine(
//     {
//       id: "botMachine",
//       initial: "idle",
//       context,
//       states: {
//         idle: {
//           on: {
//             ASK_PICK_CARD: "thinking",
//           },
//         },
//         thinking: {
//           after: {
//             DELAY: {
//               target: "choosing",
//               actions: "chooseCard",
//             },
//           },
//         },
//         choosing: {
//           type: "final",
//         },
//       },
//     },
//     {
//       actions: {
//         chooseCard: ({ context, event }) => {
//           const chosenCard = bot(event.pile, event.player);
//           return sendTo("parent", {
//             type: "CARD_CHOSEN",
//             card: chosenCard,
//             n: undefined,
//           });
//         },
//       },
//       delays: {
//         DELAY: () =>
//           MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY)),
//       },
//     },
//   );
