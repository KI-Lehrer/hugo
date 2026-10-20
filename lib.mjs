import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const project = path.dirname(fileURLToPath(import.meta.url));
export const extensions = new Set(['.txt','.md','.markdown','.csv','.pdf','.docx','.rtf','.doc']);
const excluded = new Set(['node_modules','.git','.jarvis','Library','Applications','$RECYCLE.BIN']);
export function within(root, file) {
  const relative = path.relative(root, file);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
export function weekInfo(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
  const monday = new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day));
  monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
  const sunday = new Date(monday); sunday.setUTCDate(sunday.getUTCDate()+6);
  const thursday = new Date(monday); thursday.setUTCDate(thursday.getUTCDate()+3);
  const jan4 = new Date(Date.UTC(thursday.getUTCFullYear(),0,4));
  jan4.setUTCDate(jan4.getUTCDate()-((jan4.getUTCDay()+6)%7));
  const week = 1+Math.round((monday-jan4)/604800000);
  const fmt = d=>new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(d);
  return {start:monday.toISOString().slice(0,10),end:sunday.toISOString().slice(0,10),label:`${fmt(monday)} – ${fmt(sunday)}`,number:week};
}
export function run(command, args, {input='',cwd=project,env=process.env,timeout=30000,maxOutput=3_000_000,signal}={}) {
  return new Promise((resolve,reject)=>{
    const child = spawn(command,args,{cwd,env,stdio:['pipe','pipe','pipe'],signal});
    let stdout='',stderr='',settled=false;
    const finish = (error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
    const timer=setTimeout(()=>{child.kill('SIGKILL');finish(new Error('Zeitlimit erreicht. Bitte den Auftrag eingrenzen und erneut versuchen.'));},timeout);
    child.on('error',error=>finish(error));
    child.stdout.on('data',chunk=>{stdout+=chunk;if(stdout.length>maxOutput){child.kill('SIGKILL');finish(new Error('Antwort ist zu gross.'));}});
    child.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-6000);});
    child.stdin.on('error',()=>{});
    child.on('close',code=>finish(null,{code,stdout,stderr}));
    child.stdin.end(input);
  });
}
export async function collectFiles(folders, limit=3000) {
  const files=[], warnings=[]; const seen=new Set(); let visited=0, capped=false;
  for(const folder of folders){
    const root=await fs.realpath(folder.path).catch(()=>null);
    if(!root){warnings.push(`${folder.name}: Ordner nicht erreichbar.`);continue;}
    const queue=[root];
    while(queue.length&&!capped){
      const dir=queue.shift();
      const entries=await fs.readdir(dir,{withFileTypes:true}).catch(()=>{warnings.push(`${folder.name}: Ein Unterordner ist nicht lesbar.`);return [];});
      entries.sort((a,b)=>a.name.localeCompare(b.name));
      for(const entry of entries){
        if(++visited>15000||files.length>=limit){capped=true;break;}
        if(entry.isSymbolicLink()||entry.name.startsWith('.')||excluded.has(entry.name)||/^(credentials|secrets?)(\.|$)/i.test(entry.name))continue;
        const filename=path.join(dir,entry.name);
        if(entry.isDirectory()){queue.push(filename);continue;}
        if(!entry.isFile()||!extensions.has(path.extname(filename).toLowerCase())||seen.has(filename))continue;
        const info=await fs.stat(filename).catch(()=>null);
        if(!info)continue;
        if(info.size>15_000_000){warnings.push(`${entry.name}: grösser als 15 MB, ausgelassen.`);continue;}
        seen.add(filename); files.push({id:crypto.randomUUID(),path:filename,name:entry.name,relative:path.relative(root,filename),folder:folder.name,root,folderId:folder.id,modified:info.mtime.toISOString()});
      }
    }
  }
  if(capped)warnings.push('Suchgrenze erreicht (3000 Dokumente / 15000 Einträge). Kleinere Ordner auswählen; die Suche ist unvollständig.');
  return {files,warnings};
}
const stopwords=new Set('bitte meine meinen meiner aktuellen aktuelle aktuelles diese dieser dieses diese woche fasse zusammen zusammenfassen unterricht mir eine einen eines einer den der die das und für mit aus von zum zur was ist sind'.split(' '));
export function rankFiles(files,query,week=weekInfo()) {
  const terms=(query.toLocaleLowerCase('de-CH').match(/[\p{L}\p{N}]{3,}/gu)||[]).filter(x=>!stopwords.has(x));
  return files.map(file=>{
    const name=file.relative.toLowerCase(); let score=0;
    for(const term of terms)if(name.includes(term))score+=8;
    if(/plan|wochen|unterricht|lektion|quartal|jahres/.test(name))score+=4;
    if(new RegExp(`(?:kw|woche)[ _.-]*0?${week.number}(?:\\D|$)`,'i').test(name))score+=16;
    for(let date=new Date(week.start);date<=new Date(week.end);date.setUTCDate(date.getUTCDate()+1)){
      const iso=date.toISOString().slice(0,10);const [y,m,d]=iso.split('-');
      if(name.includes(iso)||name.includes(`${d}.${m}.${y}`)||name.includes(`${d}.${m}.`))score+=15;
    }
    return {...file,score};
  }).sort((a,b)=>b.score-a.score||b.modified.localeCompare(a.modified));
}
export async function readDocument(file) {
  const real=await fs.realpath(file.path);
  if(!within(file.root,real)||real!==file.path)throw new Error('Dateipfad wurde geändert.');
  const info=await fs.stat(real);if(info.size>15_000_000)throw new Error('Datei ist zu gross.');
  const result=await run(process.env.JARVIS_PYTHON||'python3',[path.join(project,'extract.py'),real],{timeout:25000,maxOutput:500_000});
  if(result.code!==0)throw new Error('Dokument konnte nicht gelesen werden.');
  if(!result.stdout.trim())throw new Error('Kein Text gefunden; möglicherweise ist OCR nötig.');
  return result.stdout.trim();
}
