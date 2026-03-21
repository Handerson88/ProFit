interface SyncItem {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  data: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = '@profit:sync_queue';

class SyncService {
  private getQueue(): SyncItem[] {
    try {
      const q = localStorage.getItem(SYNC_QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: SyncItem[]) {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  enqueue(url: string, method: string, data: any = {}) {
    const queue = this.getQueue();
    const token = localStorage.getItem('token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    queue.push({
      id: Math.random().toString(36).substring(7),
      url,
      method,
      headers,
      data,
      timestamp: Date.now()
    });
    
    this.saveQueue(queue);

    // Se estivermos online tentamos sincronizar imediatamente em background
    if (navigator.onLine) {
      this.sync();
    }
  }

  async sync() {
    if (!navigator.onLine) return;

    const queue = this.getQueue();
    if (queue.length === 0) return;

    const remainingQueue = [];
    
    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: JSON.stringify(item.data)
        });

        if (!response.ok) {
           // Se for erro 4xx (ex: token inválido, bad request) descarte
           // Se for 5xx network, mantém na fila
           if (response.status >= 500) {
              remainingQueue.push(item);
           }
        }
      } catch (err) {
        // Network error
        remainingQueue.push(item);
      }
    }

    this.saveQueue(remainingQueue);
  }

  initListener() {
    window.addEventListener('online', () => {
      this.sync();
    });
  }
}

export const syncService = new SyncService();
