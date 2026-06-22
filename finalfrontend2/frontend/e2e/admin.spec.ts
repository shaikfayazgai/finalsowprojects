import { test } from "@playwright/test";
import { defineSmokeRouteTests } from "./helpers/routes";

test.describe("Admin portal @ui-mock", () => {
  defineSmokeRouteTests("admin");
});
