import {copyFile,mkdir,rm,readdir,stat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {build} from 'esbuild';
const root=process.cwd(),out=join(root,'www');
await rm(out,{recursive:true,force:true});
await mkdir(join(out,'assets'),{recursive:true});
await mkdir(join(out,'vendor'),{recursive:true});
for(const file of ['index.html','styles.css','app.js','auth.js','config.js','manifest.webmanifest','sw.js','register-sw.js']) await copyFile(join(root,file),join(out,file));
for(const file of ['logo-cpr.png','icon-192.png','icon-512.png'])await copyFile(join(root,'assets',file),join(out,'assets',file));
for(const [input,filename] of [['src/supabase-bridge.js','supabase.min.js'],['src/native-bridge.js','native-bridge.js']]){
 await build({entryPoints:[join(root,input)],bundle:true,platform:'browser',format:'iife',target:['chrome100'],minify:true,outfile:join(out,'vendor',filename)});
}
console.log('✅ Répertoire www généré (Windows + Android + PWA).');
