import { ScheduleItem } from '../types';

class StorageService {
  private STORAGE_KEYS = {
    SCHEDULE: 'aura_schedule',
    USER_PREFS: 'aura_user_prefs',
    SESSIONS: 'aura_sessions'
  };

  getSchedule(): ScheduleItem[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.SCHEDULE);
    return data ? JSON.parse(data) : [];
  }

  saveSchedule(items: ScheduleItem[]) {
    localStorage.setItem(this.STORAGE_KEYS.SCHEDULE, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('aura_schedule_updated'));
  }

  addScheduleItem(item: ScheduleItem) {
    const schedule = this.getSchedule();
    schedule.push(item);
    this.saveSchedule(schedule);
  }

  updateScheduleItem(updatedItem: ScheduleItem) {
    const schedule = this.getSchedule();
    const index = schedule.findIndex(item => item.id === updatedItem.id);
    if (index !== -1) {
      schedule[index] = updatedItem;
      this.saveSchedule(schedule);
    }
  }

  deleteScheduleItem(id: string) {
    const schedule = this.getSchedule();
    const filtered = schedule.filter(item => item.id !== id);
    this.saveSchedule(filtered);
  }
}

export const storageService = new StorageService();
