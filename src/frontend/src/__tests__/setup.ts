/**
 * Vitest setup for the frontend suite.
 *
 * - Adds jest-dom matchers (`toBeInTheDocument`, etc.).
 * - Teaches Testing Library that the app's stable test hook is `data-ocid`,
 *   which the generated components use throughout.
 * - Cleans up the DOM between tests.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

configure({ testIdAttribute: "data-ocid" });

// jsdom does not implement `Element.prototype.scrollIntoView`, which the room
// view calls to auto-scroll to the newest message. Stub it so the effect is a
// no-op instead of throwing and tripping the router's error boundary.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});
