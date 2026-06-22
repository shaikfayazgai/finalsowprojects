import path from "node:path";
import { test } from "@playwright/test";
import { defineSmokeRouteTests } from "./helpers/routes";

const entReviewerAuth = path.join(__dirname, ".auth", "entReviewer.json");

test.describe("Enterprise reviewer sub-portal @ui-real", () => {
  test.use({ storageState: entReviewerAuth });
  defineSmokeRouteTests("enterpriseReviewer", "@ui-real");
});
