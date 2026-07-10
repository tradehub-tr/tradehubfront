/**
 * Products Components Barrel Export
 * Re-exports all products page components for easier importing
 */

// FilterSidebar component - iSTOC-style filter panel with multiple filter types
export { FilterSidebar, initFilterSidebar, getDefaultFilterSections } from "./FilterSidebar";

// ProductListingGrid component - responsive product grid with image slider
export {
  ProductListingGrid,
  initProductListingGrid,
  renderNoResults,
  rerenderProductGrid,
  setGridViewMode,
} from "./ProductListingGrid";

// ListingCartDrawer - simplified cart drawer for products listing page
export { ListingCartDrawer, initListingCartDrawer } from "./ListingCartDrawer";

// SubHeader component - unified tabs + breadcrumb + results title + sort/view header
export { SubHeader, updateSubHeader, updateBreadcrumb } from "./SubHeader";
export type { SubHeaderProps } from "./SubHeader";

// Filter engine - connects FilterSidebar UI to ProductListingGrid
export { initFilterEngine } from "./filterEngine";
export type { FilterState, SortKey, FilterEngine, FilterEngineOptions } from "./filterEngine";

// FilterChips component - active filter chips with removal
export { renderFilterChips, updateFilterChips, initFilterChips } from "./FilterChips";
