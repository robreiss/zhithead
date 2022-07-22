import Pile from "../Pile";
import Switcher from "../Switcher";
import ShownHand from "../ShownHand";

export default function Playing() {
  return (
    <div className="flex h-full flex-col items-center justify-end gap-24 pb-10">
      <Pile />
      <div className="space-y-14">
        <Switcher />
        <ShownHand />
      </div>
    </div>
  );
}
