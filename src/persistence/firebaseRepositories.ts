import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { Workflow } from '../types/workflow';
import { StylePreset } from '../types/stylePreset';
import { Project } from '../types/project';
import { TranscriptionResult } from '../types/transcription';
import { EditDecisionList } from '../types/edl';
import { UsageEvent } from '../types/usage';
import { RenderJob } from '../types/renderJob';
import { 
  IWorkflowRepository, 
  IStylePresetRepository, 
  IProjectRepository, 
  IVideoStorageAdapter,
  ITranscriptionRepository,
  IAnalysisRepository,
  IUsageRepository,
  IRenderRepository
} from './interfaces';

// Helper to convert Firestore dates to ISO strings for our app types
const toISO = (val: any) => {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  return val;
};

export class FirebaseWorkflowRepository implements IWorkflowRepository {
  private collection = collection(db, 'workflows');

  async getAll(): Promise<Workflow[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(this.collection, where('userId', '==', uid), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        nodes: JSON.parse(data.nodesJson),
        edges: JSON.parse(data.edgesJson),
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt)
      } as Workflow;
    });
  }

  async getById(id: string): Promise<Workflow | null> {
    const docRef = doc(db, 'workflows', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    const data = d.data();
    if (data.userId !== auth.currentUser?.uid) return null;
    return {
      ...data,
      id: d.id,
      nodes: JSON.parse(data.nodesJson),
      edges: JSON.parse(data.edgesJson),
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt)
    } as Workflow;
  }

  async save(workflow: Workflow): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    
    const docRef = doc(db, 'workflows', workflow.id);
    const data = {
      ...workflow,
      userId: uid,
      nodesJson: JSON.stringify(workflow.nodes),
      edgesJson: JSON.stringify(workflow.edges),
      updatedAt: serverTimestamp(),
      createdAt: workflow.createdAt ? Timestamp.fromDate(new Date(workflow.createdAt)) : serverTimestamp()
    };
    // @ts-ignore - remove nodes/edges from top level before saving to firestore
    delete data.nodes;
    // @ts-ignore
    delete data.edges;

    await setDoc(docRef, data, { merge: true });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'workflows', id));
  }

  async duplicate(id: string): Promise<Workflow | null> {
    const original = await this.getById(id);
    if (!original) return null;

    const newWf: Workflow = {
      ...original,
      id: `wf-${Date.now()}`,
      name: `${original.name} (Cópia)`,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.save(newWf);
    return newWf;
  }

  async toggleFavorite(id: string): Promise<void> {
    const wf = await this.getById(id);
    if (wf) {
      wf.isFavorite = !wf.isFavorite;
      await this.save(wf);
    }
  }
}

export class FirebaseStylePresetRepository implements IStylePresetRepository {
  private collection = collection(db, 'style_presets');

  async getAll(): Promise<StylePreset[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(this.collection, where('userId', '==', uid), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      const config = JSON.parse(data.configJson);
      return {
        ...config,
        ...data,
        id: d.id,
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt)
      } as StylePreset;
    });
  }

  async getById(id: string): Promise<StylePreset | null> {
    const docRef = doc(db, 'style_presets', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    const data = d.data();
    if (data.userId !== auth.currentUser?.uid) return null;
    const config = JSON.parse(data.configJson);
    return {
      ...config,
      ...data,
      id: d.id,
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt)
    } as StylePreset;
  }

  async save(preset: StylePreset): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const docRef = doc(db, 'style_presets', preset.id);
    const data = {
      id: preset.id,
      userId: uid,
      name: preset.name,
      configJson: JSON.stringify(preset),
      updatedAt: serverTimestamp(),
      createdAt: preset.createdAt ? Timestamp.fromDate(new Date(preset.createdAt)) : serverTimestamp()
    };
    await setDoc(docRef, data, { merge: true });
  }
}

export class FirebaseProjectRepository implements IProjectRepository {
  private collection = collection(db, 'projects');

  async getAll(): Promise<Project[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(this.collection, where('userId', '==', uid), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt)
      } as Project;
    });
  }

  async getById(id: string): Promise<Project | null> {
    const docRef = doc(db, 'projects', id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    const data = d.data();
    if (data.userId !== auth.currentUser?.uid) return null;
    return {
      ...data,
      id: d.id,
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt)
    } as Project;
  }

  async save(project: Project): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const docRef = doc(db, 'projects', project.id);
    const data = {
      ...project,
      userId: uid,
      updatedAt: serverTimestamp(),
      createdAt: project.createdAt ? Timestamp.fromDate(new Date(project.createdAt)) : serverTimestamp()
    };
    await setDoc(docRef, data, { merge: true });
  }

  async delete(id: string): Promise<void> {
    const proj = await this.getById(id);
    if (proj?.originalVideoPath) {
      const storageAdapter = new FirebaseVideoStorageAdapter();
      await storageAdapter.delete(proj.originalVideoPath).catch(console.error);
    }
    await deleteDoc(doc(db, 'projects', id));
  }
}

export class FirebaseTranscriptionRepository implements ITranscriptionRepository {
  private collection = collection(db, 'transcripts');

  async getByHash(hash: string): Promise<TranscriptionResult | null> {
    const q = query(this.collection, where('sourceHash', '==', hash), where('userId', '==', auth.currentUser?.uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return {
      ...data,
      id: snapshot.docs[0].id,
      segments: JSON.parse(data.segmentsJson),
      words: JSON.parse(data.wordsJson),
      createdAt: toISO(data.createdAt)
    } as TranscriptionResult;
  }

  async save(transcription: TranscriptionResult): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const docRef = doc(this.collection);
    const data = {
      ...transcription,
      userId: uid,
      segmentsJson: JSON.stringify(transcription.segments),
      wordsJson: JSON.stringify(transcription.words),
      createdAt: serverTimestamp()
    };
    // @ts-ignore
    delete data.segments;
    // @ts-ignore
    delete data.words;
    await setDoc(docRef, data);
  }
}

export class FirebaseAnalysisRepository implements IAnalysisRepository {
  private collection = collection(db, 'analyses');

  async getByTranscriptHash(hash: string): Promise<EditDecisionList | null> {
    const q = query(this.collection, where('transcriptHash', '==', hash), where('userId', '==', auth.currentUser?.uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return JSON.parse(data.edlJson) as EditDecisionList;
  }

  async save(edl: EditDecisionList): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    // Using projectId as doc ID for simplicity if one analysis per project is enough for now, 
    // but the prompt says cache depends on transcript hash.
    const docRef = doc(this.collection, `${edl.projectId}_${edl.transcriptHash}`);
    await setDoc(docRef, {
      userId: uid,
      projectId: edl.projectId,
      transcriptHash: edl.transcriptHash,
      edlJson: JSON.stringify(edl),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

export class FirebaseUsageRepository implements IUsageRepository {
  private collection = collection(db, 'usage_events');

  async log(event: Omit<UsageEvent, 'id' | 'createdAt' | 'userId'>): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const docRef = doc(this.collection);
    await setDoc(docRef, {
      ...event,
      userId: uid,
      createdAt: serverTimestamp()
    });
  }
}

export class FirebaseRenderRepository implements IRenderRepository {
  private collection = collection(db, 'render_jobs');

  async getById(id: string): Promise<RenderJob | null> {
    const docRef = doc(this.collection, id);
    const d = await getDoc(docRef);
    if (!d.exists()) return null;
    const data = d.data();
    return {
      ...data,
      id: d.id,
      startedAt: toISO(data.startedAt),
      completedAt: toISO(data.completedAt)
    } as RenderJob;
  }

  async getAllByProject(projectId: string): Promise<RenderJob[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(this.collection, where('projectId', '==', projectId), where('userId', '==', uid), orderBy('startedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        startedAt: toISO(data.startedAt),
        completedAt: toISO(data.completedAt)
      } as RenderJob;
    });
  }

  async save(job: RenderJob): Promise<void> {
    const docRef = doc(this.collection, job.id);
    await setDoc(docRef, {
      ...job,
      startedAt: job.startedAt ? Timestamp.fromDate(new Date(job.startedAt)) : serverTimestamp(),
      completedAt: job.completedAt ? Timestamp.fromDate(new Date(job.completedAt)) : null,
      updatedAt: serverTimestamp()
    });
  }

  async updateStatus(id: string, status: any, progress: number, currentOperation?: string, error?: string): Promise<void> {
    const docRef = doc(this.collection, id);
    const update: any = { status, progress, updatedAt: serverTimestamp() };
    if (currentOperation) update.currentOperation = currentOperation;
    if (error) update.error = error;
    if (status === 'completed') update.completedAt = serverTimestamp();
    await setDoc(docRef, update, { merge: true });
  }
}

export class FirebaseVideoStorageAdapter implements IVideoStorageAdapter {
  async upload(file: File, path: string, onProgress?: (pct: number) => void): Promise<string> {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    });
  }

  async getSignedUrl(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  }

  async delete(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }
}
