export const NotificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  scheduleReminders: () => {
    // Basic reminder intervals for demonstration
    const reminders = [
      { id: 'breakfast', time: '08:00', message: 'Time for a healthy breakfast! 🍳' },
      { id: 'lunch', time: '13:00', message: 'Don\'t forget to log your lunch! 🥗' },
      { id: 'dinner', time: '20:00', message: 'Time for a light dinner. 🍲' },
      { id: 'water', interval: 120, message: 'Stay hydrated! Drink a glass of water. 💧' }
    ];

    console.log('Reminders scheduled:', reminders);
    
    // In a real mobile app, we'd use local notifications.
    // In this web demo, we'll check every minute for simplicity.
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(rem => {
        if (rem.time === currentTime) {
          NotificationService.notify(rem.message);
        }
      });
    };

    setInterval(checkReminders, 60000); // Check every minute
    
    // Schedule water reminder every 2 hours
    setInterval(() => {
      NotificationService.notify('Stay hydrated! Drink a glass of water. 💧');
    }, 120 * 60 * 1000);
  },

  notify: (message: string) => {
    if (Notification.permission === 'granted') {
      new Notification('ProFit Calories', {
        body: message,
        icon: '/logo.png' // Assumes there's a logo in public
      });
    } else {
      console.log('App Notification:', message);
    }
  }
};
