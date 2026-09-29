import { WorkflowCompiler } from './src/engine/WorkflowCompiler';
import { calculateStringHash } from './src/utils/hash';
import fs from 'fs';

const TEST_VIDEO_URL = 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4';
const USER_ID = 'qa-bot';
const PROJECT_ID = 'qa-project-' + Date.now();

async function runQA() {
  console.log('--- STARTING QA TEST (REAL PIPELINE) ---');

  try {
    // 1. Transcription API
    console.log('1. Testing Transcription API...');
    const transRes = await fetch('http://localhost:3000/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl: TEST_VIDEO_URL, language: 'en-US' })
    });
    
    if (!transRes.ok) throw new Error('Transcription failed: ' + (await transRes.text()));
    const transcription = await transRes.json();
    console.log('   ✓ Transcription successful. Words:', transcription.words.length);

    // 2. Speech Analysis API
    console.log('2. Testing Speech Analysis API...');
    const analysisRes = await fetch('http://localhost:3000/api/analyze-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        transcript: transcription, 
        cleanupConfig: { removerSilencio: true, duracaoMinimaSilencioSec: 0.3 } 
      })
    });
    
    if (!analysisRes.ok) throw new Error('Analysis failed: ' + (await analysisRes.text()));
    const { speechIssues } = await analysisRes.json();
    console.log('   ✓ Analysis successful. Issues found:', speechIssues.length);

    // 3. EDL generation
    const edl = {
      edlVersion: 1,
      workflowVersion: 1,
      projectId: PROJECT_ID,
      sourceHash: 'qa-hash',
      transcriptHash: calculateStringHash(transcription.rawText || transcription.text),
      analysisConfigHash: 'qa-config-hash',
      segments: transcription.segments,
      captions: [],
      speechIssues: speechIssues.map((si: any, i: number) => ({
        ...si,
        id: `qa-issue-${i}`,
        status: i < 3 ? 'auto_remove_candidate' : 'keep',
        humanDecision: i < 3 ? 'remove' : 'none',
        decisionSource: 'suggested',
        start: transcription.words.find((w: any) => w.id === si.startWordId)?.start || 0,
        end: transcription.words.find((w: any) => w.id === si.endWordId)?.end || 1,
        duration: 1
      })),
      highlights: [
        { id: 'h1', text: 'VideoFlow', start: 5, end: 6, category: 'keyword', importance: 1.0, decisionSource: 'suggested' }
      ],
      titleSuggestions: [],
      activeTitle: 'VideoFlow Real QA',
      zoomEvents: [
        { id: 'z1', timestamp: 10, duration: 2, scale: 1.15, reason: 'Emphasis', decisionSource: 'automatic' }
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        transcriptionProvider: 'gemini',
        analysisProvider: 'gemini'
      }
    };

    // Ensure 5 cuts for the test if possible, or add artificial ones
    if (edl.speechIssues.filter(i => i.humanDecision === 'remove').length < 5) {
       for(let i=0; i<5; i++) {
         if (!edl.speechIssues.some(si => si.id === `art-${i}`)) {
           edl.speechIssues.push({
             id: `art-${i}`,
             type: 'silence',
             start: 2 + (i * 8),
             end: 2.5 + (i * 8),
             duration: 0.5,
             confidence: 1.0,
             status: 'auto_remove_candidate',
             humanDecision: 'remove',
             decisionSource: 'human',
             message: 'QA Artificial Cut'
           });
         }
       }
    }

    // @ts-ignore
    edl.captions = Array.from({ length: 5 }, (_, i: number) => ({
       id: `cap-${i}`,
       start: i * 10,
       end: (i * 10) + 8,
       text: `QA Caption ${i}`,
       words: transcription.words.slice(i*5, (i*5)+4).map((w: any) => ({ text: w.word, start: w.start, end: w.end }))
    }));

    // 4. Testing Workflow Compiler
    console.log('4. Testing Workflow Compiler...');
    const workflow = {
      id: 'wf-qa',
      nodes: [
        { id: 'in', data: { nodeType: 'video-input', config: {} } },
        { id: 'sub', data: { nodeType: 'subtitles', config: { fonte: 'Arial', tamanho: 24 } } },
        { id: 'fmt', data: { nodeType: 'format', config: { aspectRatio: '9:16' } } },
        { id: 'zm', data: { nodeType: 'zoom', config: { escalaMaximaPercent: 120 } } },
        { id: 'title', data: { nodeType: 'title', config: { duracaoSec: 3.5, posicao: 'top' } } },
        { id: 'exp', data: { nodeType: 'export', config: { qualidade: 'balanced' } } }
      ],
      edges: [],
      version: 1
    };

    const stylePreset = {
      id: 'p-qa',
      corPrincipal: '#FFFFFF',
      corDestaque: '#FF0000',
      fonteLegendas: 'Arial',
      logo: ''
    };

    const renderPlan = WorkflowCompiler.compile({
      // @ts-ignore
      workflow,
      // @ts-ignore
      edl,
      // @ts-ignore
      stylePreset,
      videoMetadata: {
        url: TEST_VIDEO_URL,
        duration: 53.9,
        width: 768,
        height: 432,
        fps: 12
      },
      userId: USER_ID
    });
    console.log('   ✓ RenderPlan generated. Expected duration:', renderPlan.timeline.totalDuration.toFixed(2));

    // 5. Testing Render API
    console.log('5. Triggering Real Render...');
    const jobId = 'qa-job-' + Date.now();
    const renderTrigger = await fetch('http://localhost:3000/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renderPlan, jobId })
    });

    if (!renderTrigger.ok) throw new Error('Render trigger failed: ' + (await renderTrigger.text()));
    console.log('   ✓ Render job queued. Job ID:', jobId);

    // 6. Polling status
    console.log('6. Polling status (max 5 min)...');
    for(let i=0; i<60; i++) {
       const jobRes = await fetch(`http://localhost:3000/api/render-status/${jobId}`);
       if (jobRes.ok) {
         const job = await jobRes.json();
         console.log(`   ... [${i*5}s] Status: ${job.status} | Progress: ${job.progress}% | Op: ${job.currentOperation || '-'}`);
         if (job.status === 'completed') {
           console.log('   ✓ RENDER COMPLETED SUCCESSFULLY!');
           console.log('   ✓ Diagnostics:', JSON.stringify(job.diagnostics, null, 2));
           return;
         }
         if (job.status === 'failed') {
           throw new Error('Render job failed: ' + job.error);
         }
       }
       await new Promise(r => setTimeout(r, 5000));
    }
    console.log('   X Polling TIMEOUT.');

  } catch (err) {
    console.error('   X QA FAILED:', err);
  }
}

// @ts-ignore
runQA();
