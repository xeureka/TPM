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


// what is the essential things we have and need to work on babe

// what are the essential things we need to wrok  man niggaaa

// the other things we have and need to work on at this point

// what are the basics things we have and need to work on

// How can i improve and have to work on this things 

// so am gonna stick with the original plan of the things

// and gonnd add some full stack projets that are quite good and have to be efficnet for working at this point man

// what are the essental things we want to work on 

// one of the good projects to work on is that aon taughts man

// so for this plan out shit am gona get done with the IPS with rabbtmq and also vibe coded frontend man niggaaa

// am gonna finish and prepare and make my github properly orgaized and gonna continue to the other things man

// this is the e
