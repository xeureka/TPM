import * as semver from "semver";
import * as lock from "./lock";
import * as log from "./log";
import resolve from "./resolve";

interface DependenciesMap {
  [dependency: string]: string;
}
type DependencyStack = Array<{
  name: string;
  version: string;
  dependencies: { [dep: string]: string };
}>;
export interface PackageJson {
  dependencies?: DependenciesMap;
  devDependencies?: DependenciesMap;
}

const topLevel: {
  [name: string]: { url: string; version: string };
} = Object.create(null);

const unsatisfied: Array<{ name: string; parent: string; url: string }> = [];

async function collectDeps(
  name: string,
  constraint: string,
  stack: DependencyStack = [],
) {
  const fromLock = lock.getItem(name, constraint);

  const manifest = fromLock || (await resolve(name));

  // Add currently resolving module to CLI
  log.logResolving(name);

  const versions = Object.keys(manifest);
  const matched = constraint
    ? semver.maxSatisfying(versions, constraint)
    : versions[versions.length - 1];
  if (!matched) {
    throw new Error("Cannot resolve suitable package.");
  }

  const matchedManifest = manifest[matched]!;

  if (!topLevel[name]) {
    topLevel[name] = { url: matchedManifest.dist.tarball, version: matched };
  } else if (semver.satisfies(topLevel[name]!.version, constraint)) {
    const conflictIndex = checkStackDependencies(name, matched, stack);
    if (conflictIndex === -1) {
      return;
    }
    unsatisfied.push({
      name,
      parent: stack
        .map(({ name }) => name)
        .slice(conflictIndex - 2)
        .join("/node_modules/"),
      url: matchedManifest.dist.tarball,
    });
  } else {
    unsatisfied.push({
      name,
      parent: stack.at(-1)!.name,
      url: matchedManifest.dist.tarball,
    });
  }

  const dependencies = matchedManifest.dependencies ?? {};

  lock.updateOrCreate(`${name}@${constraint}`, {
    version: matched,
    url: matchedManifest.dist.tarball,
    shasum: matchedManifest.dist.shasum,
    dependencies,
  });

  if (dependencies) {
    stack.push({
      name,
      version: matched,
      dependencies,
    });
    await Promise.all(
      Object.entries(dependencies)
        .filter(([dep, range]) => !hasCirculation(dep, range, stack))
        .map(([dep, range]) => collectDeps(dep, range, stack.slice())),
    );
    stack.pop();
  }

  if (!constraint) {
    return { name, version: `^${matched}` };
  }
}

function checkStackDependencies(
  name: string,
  version: string,
  stack: DependencyStack,
) {
  return stack.findIndex(({ dependencies }) => {
    const semverRange = dependencies[name];
    if (!semverRange) {
      return true;
    }

    return semver.satisfies(version, semverRange);
  });
}

function hasCirculation(name: string, range: string, stack: DependencyStack) {
  return stack.some(
    (item) => item.name === name && semver.satisfies(item.version, range),
  );
}

export default async function (rootManifest: PackageJson) {
  if (rootManifest.dependencies) {
    (
      await Promise.all(
        Object.entries(rootManifest.dependencies).map((pair) =>
          collectDeps(...pair),
        ),
      )
    )
      .filter(Boolean)
      .forEach(
        (item) => (rootManifest.dependencies![item!.name] = item!.version),
      );
  }

  if (rootManifest.devDependencies) {
    (
      await Promise.all(
        Object.entries(rootManifest.devDependencies).map((pair) =>
          collectDeps(...pair),
        ),
      )
    )
      .filter(Boolean)
      .forEach(
        (item) => (rootManifest.devDependencies![item!.name] = item!.version),
      );
  }

  return { topLevel, unsatisfied };
}
