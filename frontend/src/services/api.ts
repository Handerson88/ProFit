export const API_URL = import.meta.env.VITE_API_URL || '/api';

const handleResponse = async (res: Response) => {
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = {};
  }
  
  if (!res.ok) {
    const isPublicRoute = ['/login', '/register', '/onboarding', '/forgot-password', '/reset-password', '/auth/invite'].some(path => window.location.pathname.startsWith(path));
    
    // Redirect to login if unauthorized or if user/profile is not found
    if ((res.status === 401 || res.status === 403 || (res.status === 404 && res.url.includes('/user/profile'))) && !isPublicRoute) {
      console.warn(`Auth session invalid (Status ${res.status}). Redirecting to login...`);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const errorMessage = data.message || `HTTP Error ${res.status}: ${res.statusText}`;
    throw { status: res.status, message: errorMessage };
  }
  return data;
};

export const api = {
  auth: {
    register: (name: string, email: string, password: string, referralCode?: string) => fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, referralCode })
    }).then(handleResponse),

    login: (email: string, password: string) => fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(handleResponse),

    forgotPassword: (email: string) => fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }).then(handleResponse),

    resetPassword: (payload: any) => fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

    createInvite: (name: string, email: string) => fetch(`${API_URL}/auth/invite/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name, email })
    }).then(handleResponse),

    verifyInvite: (token: string) => fetch(`${API_URL}/auth/invite/${token}`).then(handleResponse),

    activateInvite: (payload: any) => fetch(`${API_URL}/auth/invite/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),
    
    verify: () => fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse)
  },

  foods: {
    getAll: () => fetch(`${API_URL}/foods`).then(handleResponse),
    search: (query: string) => fetch(`${API_URL}/foods/search?q=${query}`).then(handleResponse)
  },

  meals: {
    add: (data: any) => fetch(`${API_URL}/meals/add`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    getSummary: (date?: string) => {
      const url = new URL(`${API_URL}/meals/summary`, window.location.origin);
      if (date) url.searchParams.append('date', date);
      return fetch(url.toString(), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(handleResponse);
    },

    getWeeklyStats: () => fetch(`${API_URL}/meals/stats/weekly`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),

    getHistory: (date?: string) => {
      const url = new URL(`${API_URL}/meals/history`, window.location.origin);
      if (date) url.searchParams.append('date', date);
      return fetch(url.toString(), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(handleResponse);
    },
    getRecentMeals: () => fetch(`${API_URL}/meals/recent`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    getCalorieHistory: () => fetch(`${API_URL}/meals/history/calories`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    scan: (imageFile: File) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      return fetch(`${API_URL}/meals/scan`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      }).then(handleResponse);
    },
    update: (id: string, data: any) => fetch(`${API_URL}/meals/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),
    delete: (id: string) => fetch(`${API_URL}/meals/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse)
  },

  quiz: {
    saveAnswer: (data: { question: string, answer: any, current_step?: string, is_complete?: boolean }) => fetch(`${API_URL}/quiz/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    getResponses: () => fetch(`${API_URL}/quiz/responses`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse)
  },

  activity: {
    log: (action: string, details?: any) => fetch(`${API_URL}/activity/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ action, details })
    }).then(handleResponse)
  },

  app: {
    getStatus: () => fetch(`${API_URL}/app/status`).then(handleResponse)
  },

  payments: {
    create: (data: { amount: number, method: string, phone: string }) => fetch(`${API_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),
    getStatus: (id: string) => fetch(`${API_URL}/payment/status/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse)
  },

  user: {
    getProfile: () => fetch(`${API_URL}/user/profile`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    
    getDashboardBootstrap: (date?: string) => {
      const url = new URL(`${API_URL}/user/dashboard-bootstrap`, window.location.origin);
      if (date) url.searchParams.append('date', date);
      return fetch(url.toString(), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(handleResponse);
    },

    update: (data: any) => fetch(`${API_URL}/user/update`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    updateAccount: (data: any) => fetch(`${API_URL}/user/update`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    submitQuiz: (data: any) => fetch(`${API_URL}/user/quiz`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    uploadProfilePhoto: (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      return fetch(`${API_URL}/user/photo-upload`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      }).then(handleResponse);
    },
    updateNotificationSettings: (notifications_enabled: boolean) => fetch(`${API_URL}/user/notifications`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ notifications_enabled })
    }).then(handleResponse),
    getPreferences: () => fetch(`${API_URL}/user/preferences`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    updatePreferences: (theme_mode: string) => fetch(`${API_URL}/user/preferences`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ theme_mode })
    }).then(handleResponse),
    getReferrals: () => fetch(`${API_URL}/user/referrals`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    completeOnboarding: () => fetch(`${API_URL}/user/update`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ onboarding_completed: true })
    }).then(handleResponse)
  },

  notifications: {
    getAll: () => fetch(`${API_URL}/notifications`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),

    getNotifications: () => fetch(`${API_URL}/notifications`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),

    markAsRead: (id: string) => fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),

    markAllAsRead: () => fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    
    registerDevice: (subscription: any, device_type: string = 'web') => fetch(`${API_URL}/notifications/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ subscription, device_type })
    }).then(handleResponse),

    saveFCMToken: (fcm_token: string) => fetch(`${API_URL}/notifications/save-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ fcm_token })
    }).then(handleResponse)
  },
  workouts: {
    generate: (data: any) => {
      const isFormData = data instanceof FormData;
      return fetch(`${API_URL}/workouts/generate`, {
        method: 'POST',
        headers: {
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: isFormData ? data : JSON.stringify(data)
      }).then(handleResponse);
    },
    getActive: () => fetch(`${API_URL}/workouts/active`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    getDetails: (id: string) => fetch(`${API_URL}/workouts/details/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    markComplete: (workout_plan_id: string, day_of_week: string) => fetch(`${API_URL}/workouts/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ workout_plan_id, day_of_week })
    }).then(handleResponse),
    getProgress: (workout_plan_id: string) => fetch(`${API_URL}/workouts/progress?workout_plan_id=${workout_plan_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    markExerciseComplete: (workout_plan_id: string, exercise_name: string, workout_day: string, completed: boolean, completed_sets: number[]) => fetch(`${API_URL}/workouts/exercise/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ workout_plan_id, exercise_name, workout_day, completed, completed_sets })
    }).then(handleResponse),
    getExerciseProgress: (workout_plan_id: string, workout_day: string) => fetch(`${API_URL}/workouts/exercise/progress?workout_plan_id=${workout_plan_id}&workout_day=${workout_day}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    reset: () => fetch(`${API_URL}/workouts/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse)
  },
  admin: {
    getDashboardData: () => fetch(`${API_URL}/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),
    getPreferences: () => fetch(`${API_URL}/admin/preferences`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(handleResponse),
    updatePreferences: (theme_mode: string) => fetch(`${API_URL}/admin/preferences`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ theme_mode })
    }).then(handleResponse),

    getUsers: () => fetch(`${API_URL}/admin/users`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    getUsersActivity: () => fetch(`${API_URL}/admin/users/activity`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    sendAdminNotification: (data: any) => fetch(`${API_URL}/admin/notifications/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    getNotificationTemplates: () => fetch(`${API_URL}/admin/notifications/templates`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    getUser: (id: string) => fetch(`${API_URL}/admin/users/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    toggleUserStatus: (id: string, is_active: boolean) => fetch(`${API_URL}/admin/users/status/${id}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ is_active })
    }).then(handleResponse),

    updateUserScanLimit: (id: string, scan_limit: number) => fetch(`${API_URL}/admin/users/limits/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ scan_limit })
    }).then(handleResponse),

    deleteUser: (id: string) => fetch(`${API_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    inviteUser: (data: any) => fetch(`${API_URL}/admin/users/invite`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    getScannedDishes: (search?: string, period?: string) => {
      const url = new URL(`${API_URL}/admin/scanned-dishes`, window.location.origin);
      if (search) url.searchParams.append('search', search);
      if (period) url.searchParams.append('period', period);
      return fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(handleResponse);
    },

    updateScannedDish: (id: string, data: any) => fetch(`${API_URL}/admin/scanned-dishes/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    deleteScannedDish: (id: string) => fetch(`${API_URL}/admin/scanned-dishes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    getFoods: () => fetch(`${API_URL}/admin/foods`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    updateFood: (id: string, data: any) => fetch(`${API_URL}/admin/foods/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    }).then(handleResponse),

    deleteFood: (id: string) => fetch(`${API_URL}/admin/foods/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    getMRRStats: () => fetch(`${API_URL}/admin/mrr/stats`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    getMRRChart: () => fetch(`${API_URL}/admin/mrr/chart`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),
    
    getWorkouts: (page: number = 1, search: string = '') => fetch(`${API_URL}/admin/workouts?page=${page}&search=${search}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    migrateWorkouts: () => fetch(`${API_URL}/admin/workouts/migrate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),

    getAIDetectedFoods: (search: string = '', sortBy: string = 'count') => 
      fetch(`${API_URL}/admin/ai-foods?search=${search}&sortBy=${sortBy}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(handleResponse),

    migrateAIFoods: () => fetch(`${API_URL}/admin/ai-foods/migrate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse)
  },
  ai: {
    getConversations: () => fetch(`${API_URL}/ai/conversations`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),
    getMessages: (id: string) => fetch(`${API_URL}/ai/messages/${id}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),
    sendMessage: (conversationId: string | null, message: string) => fetch(`${API_URL}/ai/message`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ conversationId, message })
    }).then(handleResponse),
    newConversation: () => fetch(`${API_URL}/ai/new`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),
    
    // Admin AI
    adminGetConversations: () => fetch(`${API_URL}/ai/admin/conversations`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),
    adminReply: (conversationId: string, message: string) => fetch(`${API_URL}/ai/admin/reply`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ conversationId, message })
    }).then(handleResponse)
  },
  achievements: {
    getMy: () => fetch(`${API_URL}/achievements/my`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse),
    getAll: () => fetch(`${API_URL}/achievements/all`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse)
  },
  billing: {
    sendEmail: (userId: string) => fetch(`${API_URL}/admin/billing/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId })
    }).then(handleResponse),
    getStatus: () => fetch(`${API_URL}/admin/billing/status`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(handleResponse)
  }
};
