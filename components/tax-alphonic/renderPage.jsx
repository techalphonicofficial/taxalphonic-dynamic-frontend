import {
  HomePage,
  ServicePage,
  CategoryPage,
  AdvisoryPage,
  TaxpediaPage,
  ListingPage,
  GenericPage,
} from "./pages";

export function renderPage(page) {
  switch (page.type) {
    case "home":
      return <HomePage page={page} />;

    // every service-style page -> ONE layout, sections appear only if data exists
    case "service":
    case "page-service":
    case "advisory-service":
      return <ServicePage page={page} />;

    case "category":
      return <CategoryPage page={page} />;

    case "advisory-hub":
    case "advisory-category":
      return <AdvisoryPage page={page} />;

    case "taxpedia-hub":
    case "taxpedia-category":
    case "taxpedia-topic":
      return <TaxpediaPage page={page} />;

    case "page-category":
    case "budget":
    case "loan-category":
    case "notice-department":
    case "notices-hub":
    case "bcm":
    case "contact":
    case "orders":
    case "press-release":
    case "notifications":
    case "news":
    case "judiciary":
    case "instructions":
    case "articles":
    case "circulars":
    case "itr":
    case "taxpedia-kind":
      return <ListingPage page={page} />;

    default:
      return <GenericPage page={page} />;
  }
}