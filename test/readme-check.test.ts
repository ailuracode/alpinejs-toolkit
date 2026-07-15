import { describe, expect, it } from "vitest";
import {
  parseReadmeSections,
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

  it("validates real package README files", () => {
    expect(validatePackageReadmes(process.cwd(), ["theme", "toast"])).toEqual([]);
  });
});
