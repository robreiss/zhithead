import { assign, sendTo, setup } from "xstate";
import {
  canPlay as _canPlay,
  asCards,
  Card,
  Cards,
  compareCards,
  createDeck,
  dealCardsFor,
  getRank,
  isPileBurnable,
  isPlayerCurHand,
  makePlayer,
  OffHandCards,
  totalCards,
  Player as TPlayer,
} from "../../lib";
import botMachine from "../services/bot.service";
import humanMachine from "./human.machine";

export type Player = "bot" | "human";
export type ShownHand = "hand" | "offhand";

export interface ZhitheadContext {
  deck: Card[];
  pile: Card[];
  human: TPlayer;
  bot: TPlayer;
  shownHand: {
    human: ShownHand;
    bot: ShownHand;
  };
  currentTurn: Player;
}

function createInitialContext(): ZhitheadContext {
  const shuffledDeck = shuffle(createDeck());
  const [deck, [human, bot]] = dealCardsFor(2, shuffledDeck);

  bot.offHand.faceUp = bot.hand.splice(0, 3) as OffHandCards;

  return {
    deck,
    pile: [],
    human,
    bot,
    shownHand: {
      human: "hand",
      bot: "hand",
    },
    currentTurn: "human",
  };
}

type ZhitheadEvent =
  | { type: "SET_SHOWN_HAND"; player: Player; shownHand: ShownHand }
  | { type: "TAKE_CARD" }
  | { type: "TAKE_PILE" }
  | { type: "SORT_HAND" }
  | { type: "NEW_GAME" }
  | { type: "CARD_CHOSEN"; card?: Card; n?: number };

// Action functions moved to module space
function currentPlayer(context: ZhitheadContext): TPlayer {
  return context[context.currentTurn];
}

function hasChoosenAllFaceUpCards(context: ZhitheadContext): boolean {
  return context.human.offHand.faceUp.length === 3;
}

export const zhitheadMachine = setup({
  actions: {
    createNewGame: assign(() => {
      return createInitialContext();
    }),

    emptyCards: assign(({ context }) => {
      const newContext = { ...context };
      return {
        ...newContext,
        pile: [],
        deck: [],
        human: makePlayer(),
        bot: makePlayer(),
      };
    }),

    burnPile: assign(({ context }) => {
      const newContext = { ...context };
      return {
        ...newContext,
        pile: [],
      };
    }),

    switchTurns: assign({
      currentTurn: ({ context }) =>
        context.currentTurn === "bot" ? "human" : "bot",
    }),

    takePile: assign(({ context }: { context: ZhitheadContext }) => {
      const updatedContext = { ...context };
      const player = updatedContext[context.currentTurn];
      player.hand.push(...context.pile);
      return updatedContext;
    }),

    changeSwitcher: assign(({ context }: { context: ZhitheadContext }) => {
      const updatedContext = { ...context };
      if (isPlayerCurHand(currentPlayer(context), "hand")) {
        context.shownHand[context.currentTurn] = "hand";
      } else {
        context.shownHand[context.currentTurn] = "offhand";
      }
      return updatedContext;
    }),

    play: assign(
      ({
        context,
        event,
      }: {
        context: ZhitheadContext;
        event: ZhitheadEvent;
      }) => {
        if (event.type !== "CARD_CHOSEN" || !event.card) return context;

        const player = currentPlayer(context);
        const playedCard = event.card;

        const updatedContext = { ...context };
        let updatedPlayer = { ...player };

        if (isPlayerCurHand(player, "faceDown")) {
          const updatedFaceDown = [...player.offHand.faceDown];
          updatedFaceDown[updatedFaceDown.indexOf(playedCard)] = undefined;
          updatedPlayer = {
            ...updatedPlayer,
            offHand: {
              ...updatedPlayer.offHand,
              faceDown: [
                updatedFaceDown[0],
                updatedFaceDown[1],
                updatedFaceDown[2],
              ] as OffHandCards,
            },
          };
          updatedContext.pile = [...updatedContext.pile, playedCard];
        } else {
          const isHand = isPlayerCurHand(player, "hand");
          const hand = isHand ? player.hand : player.offHand.faceUp;

          const toPlay: Cards = [playedCard];
          if (event.n) {
            const cards = asCards(hand)
              .filter((card) => getRank(card) === getRank(playedCard))
              .filter((card) => card !== playedCard)
              .slice(0, event.n - 1);
            toPlay.push(...cards);
          }

          if (isHand) {
            updatedPlayer = {
              ...updatedPlayer,
              hand: player.hand.filter((card) => !toPlay.includes(card)),
            };
          } else {
            updatedPlayer = {
              ...updatedPlayer,
              offHand: {
                ...updatedPlayer.offHand,
                faceUp: player.offHand.faceUp.map((card) =>
                  card !== undefined && toPlay.includes(card)
                    ? undefined
                    : card,
                ) as OffHandCards,
              },
            };
          }

          updatedContext.pile = [...updatedContext.pile, ...toPlay];
        }

        updatedContext[context.currentTurn] = updatedPlayer;

        return updatedContext;
      },
    ),
  },
  guards: {},
  types: {
    context: {} as ZhitheadContext,
    events: {} as ZhitheadEvent,
  },
  actors: {
    humanMachine,
    botMachine,
  },
}).createMachine({
  id: "zhithead",
  initial: "choosingFaceUpCards",
  context: createInitialContext(),
  use: {
    human: {
      src: "humanMachine",
      id: "human",
      input: ({ context }: { context: ZhitheadContext }) => context,
    },
    bot: {
      src: "botMachine",
      id: "bot",
      input: ({ context }: { context: ZhitheadContext }) => context,
    },
  },
  states: {
    choosingFaceUpCards: {
      after: {
        500: {
          target: "playing",
          guard: ({ context }) => hasChoosenAllFaceUpCards(context),
        },
      },
      entry: sendTo(
        ({ context }) => context.currentTurn,
        ({ context }) => {
          return {
            type: "ASK_PICK_CARD",
            pile: context.pile,
            player: context[context.currentTurn],
          };
        },
      ),
      on: {
        CARD_CHOSEN: [
          {
            guard: ({ context }) => !hasChoosenAllFaceUpCards(context),
            actions: ({ context, event }) => {
              if (event.type !== "CARD_CHOSEN" || !event.card) return;
              const card = event.card;
              context.human.offHand.faceUp.push(
                context.human.hand.find((c) => c === card)!,
              );
              context.human.hand.splice(context.human.hand.indexOf(card), 1);
            },
            target: "choosingFaceUpCards",
          },
        ],
      },
    },
    playing: {
      type: "parallel",
      states: {
        loop: {
          initial: "waitForMove",
          states: {
            waitForMove: {
              entry: [
                sendTo(
                  ({ context }) => context.currentTurn,
                  ({ context }) => {
                    return {
                      type: "ASK_PICK_CARD",
                      pile: context.pile,
                      player: context[context.currentTurn],
                    };
                  },
                ),
                "changeSwitcher",
              ],
              on: {
                CARD_CHOSEN: [
                  {
                    target: "waitForMove",
                    actions: ["takePile", "changeSwitcher", "switchTurns"],
                    // Bot returns undefined when no cards could be played.
                    // event.card from human should never be null.
                    guard: ({ event }) => {
                      if (event === undefined) return false;
                      if (event.type !== "CARD_CHOSEN") return false;
                      return event.card !== undefined;
                    },
                  },
                  {
                    target: "afterPlay",
                    actions: ["play"],
                    guard: ({ context, event }) => canPlay(context, event),
                  },
                  {
                    target: "waitForMove", // Ask again
                  },
                ],
                TAKE_PILE: {
                  target: "waitForMove",
                  actions: [
                    assign(({ context }: { context: ZhitheadContext }) => ({
                      shownHand: { ...context.shownHand, human: "hand" },
                    })),
                    "takePile",
                    "switchTurns",
                  ],
                  guard: ({ context }) =>
                    context.currentTurn === "human" &&
                    totalCards(context.bot) > 0,
                },
              },
            },
            afterPlay: {
              entry: ["changeSwitcher"],
              after: {
                600: {
                  actions: ["burnPile"],
                  guard: ({ context }) => isPileBurnable(context.pile),
                },
                601: {
                  target: "#won",
                  guard: ({ context }) =>
                    (!context.pile.length ||
                      _canPlay(
                        context.pile.at(-1)!,
                        context.pile.slice(0, -1),
                      )) &&
                    totalCards(context.human) === 0,
                },
                602: {
                  target: "#lost",
                  guard: ({ context }) => totalCards(context.bot) === 0,
                },
                700: {
                  actions: ["switchTurns"],
                  target: "waitForMove",
                  guard: ({ context }) =>
                    isPlayerCurHand(
                      context[context.currentTurn],
                      "hand",
                      "faceUp",
                    ),
                },
                1000: [
                  {
                    actions: ["switchTurns"],
                    target: "waitForMove",
                    guard: ({ context }) =>
                      context.currentTurn === "human" &&
                      context.pile.length > 0 &&
                      !_canPlay(
                        context.pile.at(-1)!,
                        context.pile.slice(0, -1),
                      ),
                  },
                  {
                    actions: ["takePile", "changeSwitcher", "switchTurns"],
                    target: "waitForMove",
                    guard: ({ context }) =>
                      context.currentTurn === "bot" &&
                      context.pile.length > 0 &&
                      !_canPlay(
                        context.pile.at(-1)!,
                        context.pile.slice(0, -1),
                      ),
                  },
                  {
                    actions: ["switchTurns"],
                    target: "waitForMove",
                  },
                ],
                1300: { actions: ["changeSwitcher"] },
              },
            },
          },
        },
        switcher: {
          on: {
            SET_SHOWN_HAND: {
              actions: [
                assign(({ context, event }) => ({
                  shownHand: {
                    ...context.shownHand,
                    [event.player]: event.shownHand,
                  },
                })),
              ],
            },
          },
        },
        sorter: {
          on: {
            SORT_HAND: {
              actions: assign(({ context }) => ({
                human: {
                  ...context.human,
                  hand: [...context.human.hand].sort(compareCards),
                },
              })),
            },
          },
        },
      },
    },
    won: {
      id: "won",
      on: {
        NEW_GAME: {
          actions: ["emptyCards", "createNewGame"],
          target: "choosingFaceUpCards",
        },
      },
    },
    lost: {
      id: "lost",
      on: {
        NEW_GAME: {
          actions: ["emptyCards", "createNewGame"],
          target: "choosingFaceUpCards",
        },
      },
    },
  },
});

function canPlay(context: ZhitheadContext, event: ZhitheadEvent): boolean {
  if (event.type !== "CARD_CHOSEN") return false;
  const player = currentPlayer(context);
  if (isPlayerCurHand(player, "faceDown")) return true;
  const hands = [player.hand, asCards(player.offHand.faceUp)];
  const hand = hands.find((hand) => hand.length) ?? [];
  return hand.includes(event.card!) && _canPlay(event.card!, context.pile);
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
