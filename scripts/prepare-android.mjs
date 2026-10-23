import {copyFile,mkdir,access,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base=path.join(root,'android/app/src/main');
try{await access(path.join(root,'android'));}catch{console.error('Projet Android absent : lancez npx cap add android avant.');process.exit(1);}
const java=path.join(base,'java/fr/cpr/gestion');
await mkdir(java,{recursive:true});
for(const name of ['MainActivity.java','CPRPrintPlugin.java'])await copyFile(path.join(root,'native/android',name),path.join(java,name));
// Icônes Android : copier l'icône CPR dans les ressources mipmap du projet.
for(const density of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']){
  const src=path.join(root,'resources',`ic_launcher_${density}.png`);
  const dest=path.join(base,'res',`mipmap-${density}`);
  await mkdir(dest,{recursive:true});
  for(const name of ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png']) await copyFile(src,path.join(dest,name));
}
console.log('✅ Activité Android, impression PDF et icônes CPR installées.');
