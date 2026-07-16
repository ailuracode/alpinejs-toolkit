import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractInstallPackagesFromSection,
  extractPrimaryInstallPackages,
  formatInstallCommand,
  parseReadmeSections,
  validateGettingStartedInstall,
  validateInstallPeers,
  validatePackageReadmes,
  validateReadmeContent,
} from "../scripts/readme-check.mjs";

const validReadme = `# @ailuracode/alpine-example

Short positioning statement.

## Install

\`\`\`bash
pnpm add @ailuracode/alpine-example alpinejs
\`\`\`

## Quick start

\`\`\`ts
import Alpine from "alpinejs";
\`\`\`

## Architecture

Internal details.

## License

MIT
`;

describe("readme-check", () => {
  it("parses level-2 headings", () => {
    const sections = parseReadmeSections(validReadme);
    expect(sections.map((section) => section.title)).toEqual([
      "@ailuracode/alpine-example",
      "Install",
      "Quick start",
      "Architecture",
      "License",
    ]);
  });

  it("accepts a canonical README", () => {
    expect(validateReadmeContent(validReadme, { packageFolder: "example" })).toEqual([]);
  });

  it("flags architecture before install", () => {
    const readme = `# @ailuracode/alpine-example

## Why

Too early.

## Install

\`\`\`bash
pnpm add @ailuracode/alpine-example
\`\`\`

## Quick start

\`\`\`ts
// ...
\`\`\`

## License

MIT
`;

    expect(validateReadmeContent(readme, { packageFolder: "example" })).toContain(
      'example: "Why" must appear after "## Install"'
    );
  });

  it("flags npm install and duplicate guide links", () => {
    const readme = `# @ailuracode/alpine-example

**[Full documentation →](../../docs/plugins/form.md)**

## Install

\`\`\`bash
npm install @ailuracode/alpine-example
\`\`\`

## Quick start

\`\`\`ts
// ...
\`\`\`

## License

MIT
`;

    const errors = validateReadmeContent(readme, { packageFolder: "example" });
    expect(errors.some((error) => error.includes("npm install"))).toBe(true);
    expect(errors.some((error) => error.includes("forbidden pattern"))).toBe(true);
  });

  it("builds install commands from required peers", () => {
    expect(
      formatInstallCommand("@ailuracode/alpine-form", ["@ailuracode/alpine-core", "alpinejs"])
    ).toBe("pnpm add @ailuracode/alpine-form @ailuracode/alpine-core alpinejs");
  });

  it("flags missing required peer dependencies in Install", () => {
    const readme = `# @ailuracode/alpine-form

## Install

\`\`\`bash
pnpm add @ailuracode/alpine-form alpinejs
\`\`\`

## Quick start

\`\`\`ts
// ...
\`\`\`

## License

MIT
`;

    expect(
      validateInstallPeers(readme, {
        packageFolder: "form",
        packageJson: {
          name: "@ailuracode/alpine-form",
          peerDependencies: {
            "@ailuracode/alpine-core": "^0.2.0",
            alpinejs: "^3.0.0",
          },
        },
      })
    ).toContain(
      'form: Install command is missing required peer dependency "@ailuracode/alpine-core"'
    );
  });

  it("validates real package README files", () => {
    expect(validatePackageReadmes(process.cwd(), ["theme", "form", "dialog"])).toEqual([]);
    expect(
      extractPrimaryInstallPackages(
        readFileSync(path.join(process.cwd(), "packages/form/README.md"), "utf8")
      )
    ).toContain("@ailuracode/alpine-core");
  });

  it("validates getting-started install essentials include required peers", () => {
    expect(validateGettingStartedInstall(process.cwd())).toEqual([]);
    const installed = extractInstallPackagesFromSection(
      readFileSync(path.join(process.cwd(), "docs/getting-started.md"), "utf8"),
      "Install essentials"
    );
    expect(installed).toContain("@ailuracode/alpine-toggle");
    expect(installed).toContain("@ailuracode/alpine-core");
  });
});
