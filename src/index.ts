import { findUp } from "find-up";
import * as fs from 'fs-extra'
import {type Arguments} from "yargs";

export default async function (args:Arguments) {

  // find and read the `package.json`
  const jsonPath = (await findUp('package.json'))!
  const root = await fs.readJSON(jsonPath)

  // to behave like npm i or yarn add
  const additionalPackages = args._.slice(1)
  if (additionalPackages.length){
    root.devDependencies = root.devDependencies || {}

    // we dont specify version now
    additionalPackages.forEach((pkg) => (root.devDependencies[pkg] = ""))
  }else{
    root.dependencies = root.dependencies || {}
    additionalPackages.forEach((pkg) => (root.dependencies[pkg] = ""))
  }
  /**
   * In production mode,
   * we just need to resolve production dependencies
   */
  if (args.production){
    delete root.devDependencies
  }
  // Read the lock file
  await lock.readLock()

  // Generate the dependencies information
  const info = await list(root)

  // save the lock file asychronsouly
  lock.writeLock()
  /**
   * prepare for the progress bar
   * Note that we re-compute the number of packages
   * Because of the duplication
   * number of resolved packages is not equivalent to
   * the number of packages to be installed
   */
  log.pre
}

