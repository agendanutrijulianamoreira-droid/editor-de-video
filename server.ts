import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { AI_MODELS } from './src/config/aiModels';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { ASSGenerator } from './src/utils/ASSGenerator';
import { TimelineMapper } from './src/utils/TimelineMapper';
import { FFmpegCommandBuilder } from './src/engine/FFmpegCommandBuilder';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

dotenv.config();

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: 'gen-lang-client-0818281677',
    storageBucket: 'gen-lang-client-0818281677.firebasestorage.app'
  });
}
const db = getFirestore('ai-studio-videoflowai-9850106f-37e4-433d-bd20-47cf94c9c8b8');



const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json({ limit: '100mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // --- API Endpoints ---

  app.post('/api/render', async (req, res) => {
    try {
      const { renderPlan, jobId } = req.body;
      
      // Criar job na fila persistente (Firestore)
      // O RenderWorkerService irá reivindicar este job
      const docRef = db.collection('render_jobs').doc(jobId);
      await docRef.set({
        ...req.body.jobData, // Metadados iniciais passados pelo front
        id: jobId,
        status: 'queued',
        progress: 0,
        renderPlan, // Persistimos o plano para o worker
        renderPlanHash: req.body.renderPlanHash,
        attempt: 0,
        cancelRequested: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        startedAt: FieldValue.serverTimestamp(),
        claimedBy: null
      });

      res.json({ message: 'Render queued', jobId });

    } catch (error: any) {
      console.error('Render queue error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/render-cancel', async (req, res) => {
    try {
      const { jobId } = req.body;
      const docRef = db.collection('render_jobs').doc(jobId);
      await docRef.update({ 
        cancelRequested: true,
        updatedAt: FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/render-status/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      const doc = await db.collection('render_jobs').doc(jobId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(doc.data());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/transcribe', async (req, res) => {
    try {
      const { videoUrl, language = 'pt-BR' } = req.body;
      
      // Fetch the video file bytes
      const videoRes = await fetch(videoUrl);
      const videoBuffer = await videoRes.arrayBuffer();
      const base64Video = Buffer.from(videoBuffer).toString('base64');

      const response = await ai.models.generateContent({
        model: AI_MODELS.transcription,
        contents: [
          {
            inlineData: {
              mimeType: "video/mp4",
              data: base64Video
            }
          },
          { text: `Transcreva este vídeo em ${language}. 
          IMPORTANTE: Forneça uma transcrição LITERAL e RAW. 
          NÃO remova disfluências, "ahn", "é...", "tipo", "né", repetições, falsas partidas ou gagueiras. 
          Precisamos desses elementos para o editor audiovisual.
          Forneça o resultado em formato JSON estruturado com 'text' (limpo), 'rawText' (literal), 'language', 'duration', 'segments' (array de {start, end, text}) e 'words' (array de {word, start, end, confidence}).` }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              rawText: { type: Type.STRING },
              language: { type: Type.STRING },
              duration: { type: Type.NUMBER },
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    start: { type: Type.NUMBER },
                    end: { type: Type.NUMBER },
                    text: { type: Type.STRING }
                  },
                  required: ["start", "end", "text"]
                }
              },
              words: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    start: { type: Type.NUMBER },
                    end: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["word", "start", "end"]
                }
              }
            },
            required: ["text", "rawText", "language", "duration", "segments", "words"]
          }
        }
      });

      const resultStr = response.text || '{}';
      const result = JSON.parse(resultStr);
      
      // Garantir que cada palavra tenha um ID único baseado na sua posição
      if (result.words) {
        result.words = result.words.map((w: any, index: number) => ({
          ...w,
          id: `w_${index}`
        }));
      }

      res.json(result);
    } catch (error: any) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/analyze-speech', async (req, res) => {
    try {
      const { transcript, cleanupConfig } = req.body;

      const response = await ai.models.generateContent({
        model: AI_MODELS.semanticAnalysis,
        contents: `Analise a seguinte transcrição literal de um vídeo e identifique semanticamente trechos com erros de fala, repetições desnecessárias, gagueiras e vícios de linguagem que devem ser removidos.
        
        Transcrição com Word IDs: ${JSON.stringify(transcript.words.map((w: any) => ({ id: w.id, word: w.word })))}
        Configuração de Limpeza: ${JSON.stringify(cleanupConfig)}
        
        INSTRUÇÃO CRÍTICA:
        Você deve identificar os problemas usando os IDs das palavras (startWordId e endWordId).
        NÃO tente calcular timestamps. O sistema fará isso de forma determinística.
        
        Retorne um JSON com um array 'speechIssues' contendo objetos:
        {
          "type": "error" | "repetition" | "filler",
          "startWordId": string,
          "endWordId": string,
          "confidence": number,
          "message": string
        }
        
        Siga as regras de confiança para status: >= 0.90 -> auto_remove_candidate, 0.65-0.89 -> review, < 0.65 -> keep.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              speechIssues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    startWordId: { type: Type.STRING },
                    endWordId: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    message: { type: Type.STRING }
                  },
                  required: ["type", "startWordId", "endWordId", "confidence", "message"]
                }
              }
            },
            required: ["speechIssues"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error: any) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-titles', async (req, res) => {
    try {
      const { transcript, titleConfig } = req.body;

      const response = await ai.models.generateContent({
        model: AI_MODELS.titleGeneration,
        contents: `Com base na transcrição abaixo, gere 3 sugestões de títulos impactantes seguindo estas diretrizes: ${JSON.stringify(titleConfig)}.
        Transcrição: ${transcript.text}
        
        Retorne um JSON com um array 'suggestions' contendo objetos {text, strategy, confidence}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    strategy: { type: Type.STRING },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["text", "strategy", "confidence"]
                }
              }
            },
            required: ["suggestions"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error: any) {
      console.error('Title generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-highlights', async (req, res) => {
    try {
      const { transcript, highlightConfig } = req.body;

      const response = await ai.models.generateContent({
        model: AI_MODELS.highlightAnalysis,
        contents: `Identifique palavras ou expressões curtas de alto impacto na transcrição abaixo.
        Você deve identificar os destaques usando os IDs das palavras (startWordId e endWordId).
        
        Categorias permitidas: number, pain, benefit, warning, keyword, concept.
        Transcrição com Word IDs: ${JSON.stringify(transcript.words.map((w: any) => ({ id: w.id, word: w.word })))}
        Configuração: ${JSON.stringify(highlightConfig)}
        
        Retorne um JSON com um array 'highlights' contendo objetos {text, startWordId, endWordId, category, importance}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              highlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    startWordId: { type: Type.STRING },
                    endWordId: { type: Type.STRING },
                    category: { type: Type.STRING },
                    importance: { type: Type.NUMBER }
                  },
                  required: ["text", "startWordId", "endWordId", "category", "importance"]
                }
              }
            },
            required: ["highlights"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error: any) {
      console.error('Highlight generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middlewares ---

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
