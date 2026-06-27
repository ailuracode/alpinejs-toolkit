import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = join(__dirname, "..");
const repoDocs = join(exampleRoot, "..", "docs");
const contentDocs = join(exampleRoot, "src", "content", "docs");
const pluginLabels = JSON.parse(
  await readFile(join(repoDocs, "i18n", "plugin-labels.json"), "utf8")
);

/** Docs that stay at the content root (guides), not under plugins/. */
const GUIDE_SLUGS = new Set([
  "index",
  "getting-started",
  "architecture",
  "contributing",
  "core",
  "query",
  "query-devtools",
]);

const LOCALES = [
  { id: "root", docsDir: repoDocs, contentDir: contentDocs },
  { id: "es", docsDir: join(repoDocs, "es"), contentDir: join(contentDocs, "es") },
  { id: "pt", docsDir: join(repoDocs, "pt"), contentDir: join(contentDocs, "pt") },
];

function parseTitle(body) {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? "Untitled";
}

/** Starlight renders `title` from frontmatter as the page H1 — drop the duplicate markdown heading. */
function stripLeadingH1(body) {
  return body.replace(/^#\s+.+\r?\n(?:\r?\n)*/, "");
}

function parseDescription(body, title) {
  const lines = body.split("\n");
  let afterTitle = false;

  for (const line of lines) {
    if (line.startsWith("# ")) {
      afterTitle = true;
      continue;
    }
    if (!afterTitle) {
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const text = trimmed.replace(/\*\*/g, "").replace(/`/g, "");
    if (text.length > 0) {
      return text.length > 160 ? `${text.slice(0, 157)}…` : text;
    }
  }

  return `${title} — @ailuracode Alpine.js plugin documentation.`;
}

function toFrontmatter({ title, description, extra = {} }) {
  const lines = [`title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(description)}`];

  for (const [key, value] of Object.entries(extra)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }

  return `---\n${lines.join("\n")}\n---\n\n`;
}

function splashFrontmatter({ title, description, hero }) {
  const heroYaml = [
    "hero:",
    `  title: ${JSON.stringify(hero.title)}`,
    `  tagline: ${JSON.stringify(hero.tagline)}`,
    "  actions:",
    ...hero.actions.map(
      (action) =>
        `    - text: ${JSON.stringify(action.text)}\n      link: ${JSON.stringify(action.link)}\n      icon: ${JSON.stringify(action.icon)}\n      variant: ${JSON.stringify(action.variant)}`
    ),
  ].join("\n");

  return `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\ntemplate: splash\n${heroYaml}\n---\n\n`;
}

async function fileExists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

function resolveSource(localeId, filename, englishFiles) {
  const slug = filename.replace(/\.md$/, "");
  const localePath = join(LOCALES.find((l) => l.id === localeId).docsDir, filename);
  const englishPath = join(repoDocs, filename);

  if (localeId === "root") {
    return englishPath;
  }

  if (GUIDE_SLUGS.has(slug)) {
    return fileExists(localePath).then((exists) => (exists ? localePath : null));
  }

  return fileExists(localePath).then((exists) => {
    if (exists) {
      return localePath;
    }
    if (!englishFiles.includes(filename)) {
      return null;
    }
    return englishPath;
  });
}

async function buildOutput(localeId, filename, body) {
  const slug = filename.replace(/\.md$/, "");

  if (slug === "index") {
    const splash = JSON.parse(
      await readFile(
        join(repoDocs, "i18n", `index-${localeId === "root" ? "en" : localeId}.json`),
        "utf8"
      )
    );
    const markdown = stripLeadingH1(body);
    return splashFrontmatter(splash) + markdown;
  }

  let title = parseTitle(body);
  let description = parseDescription(body, title);

  // Plugin pages: sidebar and page title stay in English; body is translated.
  if (localeId !== "root" && !GUIDE_SLUGS.has(slug)) {
    const labels = pluginLabels[localeId]?.[slug];
    if (labels) {
      title = labels.title;
      description = labels.description;
    } else {
      const englishBody = await readFile(join(repoDocs, filename), "utf8");
      title = parseTitle(englishBody);
    }
  }

  return toFrontmatter({ title, description }) + stripLeadingH1(body);
}

async function syncLocale(locale, englishFiles) {
  const pluginsDir = join(locale.contentDir, "plugins");
  await mkdir(pluginsDir, { recursive: true });

  let synced = 0;

  for (const filename of englishFiles) {
    const sourcePath = await resolveSource(locale.id, filename, englishFiles);
    if (!sourcePath) {
      continue;
    }

    const slug = filename.replace(/\.md$/, "");
    const source = await readFile(sourcePath, "utf8");
    const output = await buildOutput(locale.id, filename, source);
    const targetDir = GUIDE_SLUGS.has(slug) ? locale.contentDir : pluginsDir;

    await writeFile(join(targetDir, filename), output, "utf8");
    synced += 1;
  }

  if (locale.id !== "root") {
    let existing = [];
    try {
      existing = await readdir(pluginsDir);
    } catch {
      return synced;
    }

    const expected = new Set(
      englishFiles.filter((name) => !GUIDE_SLUGS.has(name.replace(/\.md$/, "")))
    );

    await Promise.all(
      existing
        .filter((name) => name.endsWith(".md") && !expected.has(name))
        .map((name) => rm(join(pluginsDir, name)))
    );
  }

  return synced;
}

function runTerminologyFix() {
  return new Promise((resolve, reject) => {
    const script = join(repoDocs, "i18n", "fix-terminology.mjs");
    const child = spawn(process.execPath, [script], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`fix-terminology.mjs exited with code ${code}`));
      }
    });
  });
}

async function main() {
  await runTerminologyFix();

  const englishFiles = (await readdir(repoDocs)).filter((name) => name.endsWith(".md"));
  const counts = await Promise.all(LOCALES.map((locale) => syncLocale(locale, englishFiles)));

  process.stdout.write(
    `Synced docs → ${contentDocs}\n` +
      LOCALES.map((locale, index) => `  ${locale.id}: ${counts[index]} files`).join("\n") +
      "\n"
  );
}

await main();
