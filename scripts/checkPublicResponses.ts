import express from 'express';
import { registerPublicPages } from '../server/seo';
const app=express();registerPublicPages(app);
const server=app.listen(0,'127.0.0.1',async()=>{
  try{
    const address=server.address();if(!address||typeof address==='string')throw new Error('No test listener');
    const origin=`http://127.0.0.1:${address.port}`;
    const slash=await fetch(origin+'/automations/?filter=dental',{redirect:'manual'});
    if(slash.status!==301||slash.headers.get('location')!=='/automations?filter=dental')throw new Error('Trailing slash redirect failed');
    const detail=await fetch(origin+'/automations/hospital-lifecycle');const text=await detail.text();
    if(detail.status!==200||!text.includes('Operational contract')||!text.includes('What to measure')||!text.includes('Human fallback'))throw new Error('Operational contract missing from initial HTML');
    const missing=await fetch(origin+'/automations/unknown');if(missing.status!==404)throw new Error('Missing route is not404');
    console.log('PASS: production HTML includes operational contract; trailing-slash301 preserves query; unknown route404.');
  }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});
