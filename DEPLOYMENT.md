# Deployment Guide - VideoFlow AI

Esta arquitetura foi desacoplada para suportar deploy real e escalabilidade.

## Arquitetura

O sistema é dividido em dois componentes principais:

1.  **Web App (Frontend + API)**:
    *   Interface do usuário, autenticação e gerenciamento de projetos.
    *   Pode ser hospedado na **Vercel**, Cloud Run ou qualquer provedor Node.js.
    *   Se comunica com o Firestore para criar jobs de renderização.

2.  **Render Worker**:
    *   Processo independente que consome jobs do Firestore.
    *   Executa o processamento pesado de vídeo via FFmpeg.
    *   Pode rodar em containers (Docker) em serviços como Cloud Run (com CPU dedicada), AWS ECS ou um VPS próprio.

---

## Variáveis de Ambiente

### Web App (.env)
*   `VITE_FIREBASE_API_KEY`: Chave do Firebase.
*   `VITE_FIREBASE_AUTH_DOMAIN`: Domínio de auth.
*   `VITE_FIREBASE_PROJECT_ID`: ID do projeto.
*   `VITE_FIREBASE_STORAGE_BUCKET`: Bucket do Storage.
*   `VITE_FIREBASE_MESSAGING_SENDER_ID`: ID de mensagens.
*   `VITE_FIREBASE_APP_ID`: ID do App.
*   `GEMINI_API_KEY`: Chave secreta do Gemini (para o backend).

### Render Worker (.env)
*   `GOOGLE_APPLICATION_CREDENTIALS`: Caminho para o JSON da Service Account (opcional se rodar em GCP).
*   `MAX_CONCURRENT_RENDERS`: Quantos vídeos processar ao mesmo tempo (padrão: 1).
*   `MAX_VIDEO_DURATION`: Limite em segundos (padrão: 300).
*   `MAX_RENDER_ATTEMPTS`: Tentativas em caso de falha (padrão: 3).
*   `WORKER_ID`: Identificador único (gerado automaticamente se ausente).
*   `WORKER_PORT`: Porta para o health check (padrão: 3001).

---

## Comandos de Execução

### Localmente
Terminal 1 (Web):
```bash
npm run dev
```

Terminal 2 (Worker):
```bash
npm run worker
```

### Docker (Worker)
Build:
```bash
docker build -t videoflow-worker -f Dockerfile.worker .
```

Run:
```bash
docker run -e GOOGLE_APPLICATION_CREDENTIALS=/app/creds.json videoflow-worker
```

---

## Recuperação de Jobs e Resiliência

*   **Claim Atômico**: O worker usa transações do Firestore para garantir que somente um processo reivindique o job.
*   **Lease & Heartbeat**: Cada claim possui uma validade (Lease). O worker atualiza o `heartbeatAt` periodicamente. Se o worker morrer, o lease expirará e outro worker poderá recuperar o job automaticamente.
*   **Idempotência**: O `renderPlanHash` é validado para evitar retrabalho.
*   **Cancelamento**: O worker monitora o campo `cancelRequested` no Firestore e interrompe o FFmpeg de forma limpa.

---

## Regras de Segurança (Firestore)

As regras foram endurecidas para que o cliente web não consiga falsificar o status de conclusão ou progresso dos jobs. O cliente pode apenas:
1.  Criar um job com status `queued`.
2.  Solicitar cancelamento (`cancelRequested: true`).
3.  Ler seus próprios jobs.

---

## Pronto para Deploy: SIM

**Bloqueadores**: Nenhum.
**Recomendação**: Para deploy na Vercel, certifique-se de configurar as Edge Functions ou Serverless Functions adequadamente, mas lembre-se que o Worker **deve** rodar em um ambiente com FFmpeg disponível e tempo de execução maior que os limites padrão de Serverless.
