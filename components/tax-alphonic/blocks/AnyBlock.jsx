import CommonBlock from "./CommonBlocks";
import { isCommonSection, isHomeSection, isServiceSection } from "./commonBlockTypes";
import { HomeBlock } from "../home/HomeSections";
import { JourneyBlock } from "../journey/JourneySections";
import { isJourneySection } from "../journey/journeyBlockTypes";
import { ServiceBodyBlock } from "../pages/ApiServicePage";
import { ToolBlock } from "../tools/ToolSections";
import { isToolSection } from "../tools/toolBlockTypes";

/**
 * A block from another builder (admin: every builder offers every block): it brings its own
 * styles with it. Null for a type that cannot render here. The caller adds the block's background.
 */
export default function AnyBlock({ section }) {
  if (isHomeSection(section)) return <HomeBlock section={section} />;
  if (isCommonSection(section)) return <CommonBlock section={section} />;
  if (isServiceSection(section)) return <ServiceBodyBlock section={section} />;
  if (isJourneySection(section)) return <JourneyBlock section={section} />;
  if (isToolSection(section)) return <ToolBlock section={section} />;
  return null;
}
