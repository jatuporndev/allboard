// Uses an existing Firebase CLI login; credentials never leave process memory.
// Usage: node scripts/setup-firebase.cjs <firebase-tools directory> [storage]
const path=require('node:path');
const cli=process.argv[2];
if(!cli)throw Error('Pass the installed firebase-tools directory.');
const {getGlobalDefaultAccount}=require(path.join(cli,'lib/auth.js'));
const {requireAuth}=require(path.join(cli,'lib/requireAuth.js'));
const {Client}=require(path.join(cli,'lib/apiv2.js'));
(async()=>{
  const project='allboard-e45e3',account=getGlobalDefaultAccount();
  if(!account)throw Error('Run firebase login first.');
  await requireAuth({project,...account});
  const identity=new Client({urlPrefix:'https://identitytoolkit.googleapis.com',apiVersion:'admin/v2'});
  await identity.patch(`/projects/${project}/config`,{signIn:{anonymous:{enabled:true}}},{queryParams:{updateMask:'signIn.anonymous.enabled'}});
  console.log('Anonymous authentication enabled.');
  if(process.argv.includes('storage')){
    const storage=new Client({urlPrefix:'https://firebasestorage.googleapis.com',apiVersion:'v1alpha'});
    await storage.post(`/projects/${project}/defaultBucket`,{location:'ASIA-SOUTHEAST1'});
    console.log('Default Storage bucket provisioned in Singapore.');
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
