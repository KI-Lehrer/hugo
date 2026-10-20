import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {weekInfo,within,collectFiles,rankFiles,readDocument,run} from '../lib.mjs';

test('Zurich week includes Monday and handles Sunday/year boundary',()=>{
  assert.deepEqual(weekInfo(new Date('2026-10-19T10:00:00Z')),{start:'2026-10-19',end:'2026-10-25',label:'19.10.2026 – 25.10.2026',number:43});
  assert.equal(weekInfo(new Date('2026-10-18T22:30:00Z')).start,'2026-10-19');
  assert.equal(weekInfo(new Date('2027-01-01T12:00:00Z')).number,53);
  assert.equal(weekInfo(new Date('2026-10-25T12:00:00Z')).start,'2026-10-19');
});
test('folder boundary distinguishes prefix siblings',()=>{
  assert.equal(within('/tmp/school','/tmp/school/plan.txt'),true);
  assert.equal(within('/tmp/school','/tmp/school-other/plan.txt'),false);
  assert.equal(within('/tmp/school','/tmp/school/../secret'),false);
});
test('scanner excludes symlinks, hidden secrets and unsupported files; reader rejects a changed symlink',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jarvis-core-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const allowed=path.join(dir,'allowed');await fs.mkdir(allowed);
  await fs.writeFile(path.join(dir,'outside.txt'),'DO NOT READ');
  await fs.writeFile(path.join(allowed,'Wochenplan KW43.md'),'19.10.2026: Deutsch – Gesprächsregeln.');
  await fs.writeFile(path.join(allowed,'.env.txt'),'secret');
  await fs.writeFile(path.join(allowed,'credentials.txt'),'secret');
  await fs.writeFile(path.join(allowed,'image.png'),'image');
  await fs.symlink(path.join(dir,'outside.txt'),path.join(allowed,'linked.txt'));
  const {files}=await collectFiles([{path:allowed,name:'School',id:'school'}]);
  assert.equal(files.length,1);assert.match(await readDocument(files[0]),/Gesprächsregeln/);
  await fs.unlink(files[0].path);await fs.symlink(path.join(dir,'outside.txt'),files[0].path);
  await assert.rejects(()=>readDocument(files[0]),/Dateipfad/);
});
test('weekly filename outranks a recently modified unrelated file',()=>{
  const files=[{relative:'Einkauf.txt',modified:'2026-10-19T12:00:00Z'},{relative:'Mathe/Wochenplan KW43.md',modified:'2026-08-01T12:00:00Z'}];
  assert.match(rankFiles(files,'Fasse die Planung dieser Woche zusammen',weekInfo(new Date('2026-10-19T12:00:00Z')))[0].relative,/KW43/);
});
test('scanner reports truncation instead of completeness',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jarvis-limit-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  await fs.writeFile(path.join(dir,'a.txt'),'a');await fs.writeFile(path.join(dir,'b.txt'),'b');
  const result=await collectFiles([{path:dir,name:'Test',id:'test'}],1);assert.equal(result.files.length,1);assert.ok(result.warnings.length);
});
test('DOCX extraction retains paragraph text',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jarvis-docx-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'plan.docx');
  const result=await run('python3',['-c',"import zipfile,sys; z=zipfile.ZipFile(sys.argv[1],'w');z.writestr('word/document.xml','<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body><w:p><w:r><w:t>Mathematik am Montag</w:t></w:r></w:p></w:body></w:document>');z.close()",file]);
  assert.equal(result.code,0);assert.match(await readDocument({path:await fs.realpath(file),root:await fs.realpath(dir)}),/Mathematik am Montag/);
});
test('PDF text and blank scans are distinguished',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jarvis-pdf-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'blank.pdf');const result=await run('python3',['-c',"from pypdf import PdfWriter; import sys; w=PdfWriter(); w.add_blank_page(width=300,height=300);w.write(sys.argv[1])",file]);
  assert.equal(result.code,0);await assert.rejects(async()=>readDocument({path:await fs.realpath(file),root:await fs.realpath(dir)}),/OCR/);
});
