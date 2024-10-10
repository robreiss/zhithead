import { action, createMachine, interpret, state, transition } from "robot3";
import { Card } from "../../lib";
import { PlayerEvents } from "../shared/player-events"; // Assuming PlayerEvents is your custom event handler

const humanMachine = createMachine({
  idle: state(transition("ASK_PICK_CARD", "waitingForHuman")),
  waitingForHuman: state(
    transition(
      "CHOOSE_CARD",
      "idle",
      action((ctx, event: { card: Card; n: number }) => {
        // Equivalent to XState's sendParent
        PlayerEvents["CARD_CHOSEN"](event.card, event.n);
      })
    )
  ),
});

// Create the service and define what happens on state change
const humanService = interpret(humanMachine, () => {
  if (humanService.machine.current === "idle") {
    console.log("Returned to idle");
  } else if (humanService.machine.current === "waitingForHuman") {
    console.log("Waiting for human to pick a card...");
  }
});

// Send events to trigger transitions
// humanService.send("ASK_PICK_CARD"); // Waiting for human to pick a card...
// humanService.send({ type: "CHOOSE_CARD", card: someCard, n: 1 }); // Returned to idle
