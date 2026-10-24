import { notFound } from "next/navigation";
import ExplorePage from "@/components/tax-alphonic/explore/ExplorePage";
import { findMenuNode, getHeaderMenuTree, leafCount } from "@/service/menuExploreService";
import { createMetadata } from "@/lib/seoMetadata";

/*
 * /explore/<item>[/<column>]: the services under a header menu item (Menus & Navigation), e.g.
 * /explore/startup, /explore/products/tools-calculators. Built from the menu, so a new menu
 * link shows here without any other change.
 */
export const revalidate = 60;

async function load(params) {
  const { path = [] } = await params;
  const segments = path.map((s) => decodeURIComponent(s).toLowerCase()).slice(0, 2);
  return findMenuNode(segments);
}

export async function generateMetadata({ params }) {
  const found = await load(params);
  if (!found) return { title: "Page not found", robots: { index: false, follow: false } };
  const { node, parent } = found;
  const name = parent ? `${node.title} – ${parent.title}` : node.title;
  return createMetadata({
    metaTitle: `${name} services | Tax Alphonic`,
    metaDescription: `Explore ${leafCount(node)} ${node.title} services by Tax Alphonic: ${node.children.slice(0, 6).map((c) => c.title).join(", ")} and more.`,
    canonicalUrl: node.explore,
  });
}

export default async function ExploreRoute({ params }) {
  const found = await load(params);
  if (!found) notFound();
  const tree = await getHeaderMenuTree();
  return <ExplorePage node={found.node} parent={found.parent} tree={tree} />;
}
