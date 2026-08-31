const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const URL = "http://127.0.0.1:5500";

const viewports = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "875x800", width: 875, height: 800 },
  { name: "800x800", width: 800, height: 800 },
  { name: "800x500", width: 800, height: 500 },
  { name: "375x667", width: 375, height: 667 },
  { name: "320x568", width: 320, height: 568 },
];

const screenshotsDir = path.join(__dirname, "qa-screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch();

  const results = [];

  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    });

    const consoleErrors = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    page.on("pageerror", (error) => {
      consoleErrors.push(error.message);
    });

    console.log(`\nChecking ${viewport.name}...`);

    try {
      await page.goto(URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Небольшая задержка для CSS-анимаций / JS-рендера
      await page.waitForTimeout(300);

      const checks = await page.evaluate(() => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const horizontalOverflow =
          document.documentElement.scrollWidth > viewportWidth;

        const overflowingElements = [];

        for (const element of document.querySelectorAll("*")) {
          const rect = element.getBoundingClientRect();

          // Пропускаем невидимые элементы
          if (
            rect.width === 0 &&
            rect.height === 0
          ) {
            continue;
          }

          // Элемент выходит вправо
          if (rect.right > viewportWidth + 1) {
            overflowingElements.push({
              direction: "right",
              tag: element.tagName.toLowerCase(),
              id: element.id || null,
              className:
                typeof element.className === "string"
                  ? element.className
                  : null,
              right: Math.round(rect.right),
              viewportWidth,
            });
          }

          // Элемент выходит влево
          if (rect.left < -1) {
            overflowingElements.push({
              direction: "left",
              tag: element.tagName.toLowerCase(),
              id: element.id || null,
              className:
                typeof element.className === "string"
                  ? element.className
                  : null,
              left: Math.round(rect.left),
              viewportWidth,
            });
          }
        }

        return {
          horizontalOverflow,
          overflowingElements,
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth,
          viewportHeight,
        };
      });

      const screenshotPath = path.join(
        screenshotsDir,
        `${viewport.name}.png`
      );

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      const passed =
        !checks.horizontalOverflow &&
        checks.overflowingElements.length === 0 &&
        consoleErrors.length === 0;

      results.push({
        viewport,
        passed,
        checks,
        consoleErrors,
      });

      if (passed) {
        console.log(`✅ ${viewport.name} PASS`);
      } else {
        console.log(`❌ ${viewport.name} FAIL`);

        if (checks.horizontalOverflow) {
          console.log(
            `   Horizontal overflow: page ${checks.pageWidth}px > viewport ${checks.viewportWidth}px`
          );
        }

        if (checks.overflowingElements.length > 0) {
          console.log(
            `   Overflowing elements: ${checks.overflowingElements.length}`
          );

          for (const element of checks.overflowingElements) {
            const selector = [
              element.tag,
              element.id ? `#${element.id}` : "",
              element.className
                ? `.${element.className
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .join(".")}`
                : "",
            ].join("");

            console.log(
              `   → ${selector} (${element.direction})`
            );
          }
        }

        if (consoleErrors.length > 0) {
          console.log(
            `   JavaScript errors: ${consoleErrors.length}`
          );

          for (const error of consoleErrors) {
            console.log(`   → ${error}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ ${viewport.name} ERROR`);
      console.log(`   ${error.message}`);

      results.push({
        viewport,
        passed: false,
        error: error.message,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  printSummary(results);

  const hasFailures = results.some((result) => !result.passed);

  process.exitCode = hasFailures ? 1 : 0;
}

function printSummary(results) {
  console.log("\n");
  console.log("========================================");
  console.log("         RESPONSIVE QA SUMMARY");
  console.log("========================================");

  for (const result of results) {
    console.log(
      `${result.passed ? "✅" : "❌"} ${result.viewport.name}`
    );
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  console.log("----------------------------------------");
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log("========================================\n");

  if (failed > 0) {
    console.log("Failed viewports:\n");

    for (const result of results.filter(
      (result) => !result.passed
    )) {
      console.log(`❌ ${result.viewport.name}`);

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      if (result.checks?.horizontalOverflow) {
        console.log(
          `   Horizontal overflow detected`
        );
      }

      if (result.checks?.overflowingElements?.length) {
        console.log(
          `   Elements outside viewport: ${result.checks.overflowingElements.length}`
        );
      }

      if (result.consoleErrors?.length) {
        console.log(
          `   Console errors: ${result.consoleErrors.length}`
        );
      }

      console.log("");
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});