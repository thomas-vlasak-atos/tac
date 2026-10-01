import { CardBackSvg } from "./cardFaces.js";

export function CardBack({ count }: { count: number }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 28, borderRadius: 4, boxShadow: "0 2px 4px #3e241c44" }}><CardBackSvg /></div><span>{count}</span></div>;
}
