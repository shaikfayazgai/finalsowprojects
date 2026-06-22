import path from "node:path";
import { test } from "@playwright/test";
import { defineSmokeRouteTests } from "./helpers/routes";

const enterpriseAuth = path.join(__dirname, ".auth", "enterprise.json");

test.describe("Analytics portal @ui-mock", () => {
  test.use({ storageState: enterpriseAuth });
  defineSmokeRouteTests("analytics");
});
