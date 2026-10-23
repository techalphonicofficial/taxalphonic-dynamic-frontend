// Journey block types, shared by the server route (app/[...slug]/page.jsx, which decides whether a
// page is a Journey Stage page) and JourneySections.jsx. Kept out of that "use client" file:
// a server component cannot call a function exported from a client module.
// Must match JOURNEY_BLOCKS in the admin's src/components/page-builder/journeyBlocks.js.
export const JOURNEY_BLOCK_TYPES = [
  "JourneyProgress", "JourneyHero", "JourneyOffer", "JourneyRoadmap", "JourneySteps", "JourneyDeliverables",
  "JourneyWhy", "JourneyStory", "JourneyFlow", "JourneyPhotos", "JourneySectors", "JourneyResources",
  "JourneyNav", "JourneyKnowledge", "JourneyCta",
];

export const isJourneySection = (section) => JOURNEY_BLOCK_TYPES.includes(section?.type);
