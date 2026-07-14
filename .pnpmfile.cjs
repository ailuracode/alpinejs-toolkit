/**
 * Strip jsdom from Vitest's optional peers — this repo uses happy-dom only.
 */
function readPackage(pkg) {
  if (pkg.name === "vitest") {
    if (pkg.peerDependencies) {
      delete pkg.peerDependencies.jsdom;
    }
    if (pkg.peerDependenciesMeta) {
      delete pkg.peerDependenciesMeta.jsdom;
    }
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
