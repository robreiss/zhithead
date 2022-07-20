import clsx from "clsx";
import { motion } from "framer-motion";
import { Card as LibCard, getRank, getSuite, Rank, Suite } from "../lib";

export const WIDTH = 165;

function createCardSVGPath(card: LibCard) {
  const suitePathComponent = Suite[getSuite(card)].toUpperCase().slice(0, -1);
  const r = getRank(card);
  const rankPathComponent = `${r + 1}${
    r >= Rank.Jack ? `-${Rank[r].toUpperCase()}` : ""
  }`;
  return `/cards/${suitePathComponent}-${rankPathComponent}.svg`;
}

export interface CardProps {
  card?: LibCard;
  flipped?: boolean;
}

export default function Card(props: CardProps) {
  const src =
    props.flipped || props.card === undefined
      ? "/cards/BACK.svg"
      : createCardSVGPath(props.card);

  return (
    <motion.img
      layoutId={props.card?.toString()}
      className={clsx(
        `relative h-card w-card select-none rounded-2xl bg-zinc-600 p-2`,
        props.card !== undefined && "z-10"
      )}
      src={src}
    />
  );
}
