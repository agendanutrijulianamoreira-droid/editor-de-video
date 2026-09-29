import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({
    projectId: 'gen-lang-client-0818281677',
    storageBucket: 'gen-lang-client-0818281677.firebasestorage.app'
  });
}
const db = getFirestore('ai-studio-videoflowai-9850106f-37e4-433d-bd20-47cf94c9c8b8');

async function checkJobs() {
  const snapshot = await db.collection('render_jobs').orderBy('updatedAt', 'desc').limit(5).get();
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Job ID: ${doc.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`Progress: ${data.progress}%`);
    console.log(`Op: ${data.currentOperation}`);
    if (data.diagnostics) {
       console.log(`Diagnostics: ${JSON.stringify(data.diagnostics, null, 2)}`);
    }
    console.log('---');
  });
}

checkJobs();
