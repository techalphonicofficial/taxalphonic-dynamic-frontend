import { mainWidthProps } from "./layoutSections";

/**
 * One layout section. render(section, placement) comes from the page renderer, as do the classes
 * its column styles depend on. A main + sidebar section with only one side uses the full width.
 */
export default function LayoutGroup({ group, render, bodyClass = "", mainClass = "", sideClass = "" }) {
  if (!group.items.length) return null;
  if (group.layout === "full") return <div className="ta-lg ta-lg-full">{group.items.map((section) => render(section, "bottom"))}</div>;

  const side = group.items.filter((section) => section.config?.placement === "sidebar");
  const main = group.items.filter((section) => section.config?.placement !== "sidebar");
  const both = main.length > 0 && side.length > 0;
  return (
    <div className={`ta-lg ta-lg-body ${bodyClass}${both ? (group.mainWidth ? " ta-lg-w" : "") : " ta-lg-solo"}`} {...(both ? mainWidthProps(group.mainWidth) : {})}>
      {main.length > 0 && <div className={mainClass}>{main.map((section) => render(section, "main"))}</div>}
      {side.length > 0 && (both
        ? <aside className={sideClass}>{side.map((section) => render(section, "sidebar"))}</aside>
        : <div className={mainClass}>{side.map((section) => render(section, "main"))}</div>)}
    </div>
  );
}
