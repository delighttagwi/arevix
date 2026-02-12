
import { User, BoardTask, Comment, Message } from '../types';

const USERS_KEY = 'aervix_users';
const TASKS_PREFIX = 'aervix_tasks_';
const MESSAGES_KEY = 'aervix_messages';

export const storage = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveUser: (user: User) => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  getTasks: (userId: string): BoardTask[] => {
    const data = localStorage.getItem(`${TASKS_PREFIX}${userId}`);
    return data ? JSON.parse(data) : [];
  },
  saveTask: (userId: string, task: BoardTask) => {
    const tasks = storage.getTasks(userId);
    tasks.push(task);
    localStorage.setItem(`${TASKS_PREFIX}${userId}`, JSON.stringify(tasks));
  },
  getAllTasks: (): BoardTask[] => {
    const allTasks: BoardTask[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(TASKS_PREFIX)) {
        const tasks = JSON.parse(localStorage.getItem(key) || '[]');
        allTasks.push(...tasks);
      }
    }
    return allTasks.sort((a, b) => b.timestamp - a.timestamp);
  },
  addComment: (taskUserId: string, taskId: string, comment: Comment) => {
    const tasks = storage.getTasks(taskUserId);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      if (!tasks[taskIndex].comments) tasks[taskIndex].comments = [];
      tasks[taskIndex].comments!.push(comment);
      localStorage.setItem(`${TASKS_PREFIX}${taskUserId}`, JSON.stringify(tasks));
    }
  },
  getMessages: (userId: string): Message[] => {
    const data = localStorage.getItem(MESSAGES_KEY);
    const allMessages: Message[] = data ? JSON.parse(data) : [];
    return allMessages.filter(m => m.fromUserId === userId || m.toUserId === userId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },
  sendMessage: (message: Message) => {
    const data = localStorage.getItem(MESSAGES_KEY);
    const allMessages: Message[] = data ? JSON.parse(data) : [];
    allMessages.push(message);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  }
};
