import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

const SYNC_QUEUE_KEY = '@agapp_field_sync_queue';

type SyncTask = {
  id: string; // unique task id
  type: 'UPDATE_REPORT_STATUS';
  payload: {
    reportId: string;
    status: string;
  };
  createdAt: number;
};

export class OfflineSyncManager {
  static async getQueue(): Promise<SyncTask[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async enqueueTask(task: Omit<SyncTask, 'id' | 'createdAt'>) {
    const queue = await this.getQueue();
    queue.push({
      ...task,
      id: Math.random().toString(36).substring(7),
      createdAt: Date.now(),
    });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  static async syncAll() {
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    const remainingQueue: SyncTask[] = [];

    for (const task of queue) {
      if (task.type === 'UPDATE_REPORT_STATUS') {
        const { error } = await supabase
          .from('reports')
          .update({ status: task.payload.status })
          .eq('id', task.payload.reportId);
        
        if (error) {
          // If it's a network error, keep it in the queue. Otherwise, maybe drop it.
          // For simplicity, we assume any error means keep it in queue to try later.
          console.log(`Failed to sync task ${task.id}`, error);
          remainingQueue.push(task);
        } else {
          console.log(`Successfully synced task ${task.id}`);
        }
      }
    }

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
  }
}
