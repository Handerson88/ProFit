import { api, API_URL } from './api';
import { syncService } from './syncService';

class QuizService {
  async saveAnswer(question: string, answer: any, current_step?: string, is_complete?: boolean) {
    try {
      await api.quiz.saveAnswer({
        question,
        answer,
        current_step,
        is_complete
      });
    } catch (err: any) {
      // Offline fallback: if network error, enqueue
      // Usually fetch throws TypeError on network errors. Our api wrapper might cast it
      if (!err.status || err.status >= 500 || err.message === 'Failed to fetch') {
        syncService.enqueue(`${API_URL}/quiz/answer`, 'POST', {
          question,
          answer,
          current_step,
          is_complete
        });
      } else {
        throw err;
      }
    }
  }

  async getResponses() {
    try {
      return await api.quiz.getResponses();
    } catch (err) {
      console.error('Failed to get quiz responses:', err);
      // Return a safe default to not crash
      return { responses: [], progress: { current_step: null, is_complete: false } };
    }
  }
}

export const quizService = new QuizService();
