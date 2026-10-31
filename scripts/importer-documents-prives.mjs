import { readFile, access } from 'node:fs/promises';
import { extname, basename, join } from 'node:path';
const base='https://tdsrqmpfdvntybdlvejy.supabase.co';
const key=process.env.SERVICE_KEY;
if(!key)throw Error('SUPABASE_SERVICE_ROLE_KEY manquant');
const files=[
'coloriages_15x21.pdf',
'affiches_kitcom.zip',
'A4_Cocotte_Rebond_générique_1.pdf',
'A4_Cocotte_Rebond_générique_2.pdf',
'Kit du relayeur_Print_A5_18052026.pdf',
'fresque_A3_A.pdf',
'fresque_A3_B.pdf'
];
for(const name of files){
 const source=join('ressources',name);
 await access(source);
 const bytes=await readFile(source);
 if(!bytes.length)throw Error('Fichier vide: '+source);
 const path='documents/communs/'+encodeURIComponent(name.normalize('NFC')).replace(/%/g,'_');
 const url=base+'/storage/v1/object/rebondplay-prive/'+path.split('/').map(encodeURIComponent).join('/');
 const res=await fetch(url,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':extname(name)==='.pdf'?'application/pdf':'application/zip','x-upsert':'true'},body:bytes});
 const response=await res.text();
 if(!res.ok)throw Error('Échec '+name+' : '+res.status+' '+response.slice(0,300));
 console.log('Copié: '+name+' ('+bytes.length+' octets)');
}
console.log('Import terminé. Ne pas retirer les originaux avant les tests de téléchargement.');
