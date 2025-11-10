import { request } from "undici";

export interface Manifest{
 [version: string]:{
  dependencies?:{[dep: string]: string},
  dist:{shasum: string, tarball:string},
 }
}

const REGISTRY = process.env.REGISTRY || 'https://registry.npmjs.org/'


const cache: {[dep: string]:Manifest} = Object.create(null)

export default async function(name:string):Promise<Manifest>{

 const cached = cache[name]
 if (cached){
  return cached
 }

 const response = await request(`${REGISTRY}${name}`)

 const json = (await response.body.json()) as 
  | {error: string}
  | {versions: Manifest}
 
 if ('error' in json){
  throw new ReferenceError(`No such package: ${name}`)
 }

 return (cache[name] = json.versions)
}
