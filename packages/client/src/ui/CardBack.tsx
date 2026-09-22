import cardBack from "../../../../cards/background.png";

export function CardBack({ count }: { count: number }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 7 }}><div style={{ width: 28, height: 40, borderRadius: 4, overflow: "hidden", border: "2px solid #fff8e7", boxShadow: "0 2px 4px #3e241c44" }}><img src={cardBack} alt="Verdeckte Karten" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><span>{count}</span></div>;
}
