import * as fs from "fs-extra";
import * as tar from "tar";
import { request } from "undici";
import * as log from "./log";

export default async function (name: string, url: string, location = "") {
  const path = `${process.cwd()}${location}/node_modules/${name}`;

  await fs.mkdirp(path);

  const response = await request(url);
  response.body
    ?.pipe(tar.extract({ cwd: path, strip: 1 }))
    .on("close", log.tickInstalling);
}
