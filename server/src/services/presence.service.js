const onlineUsers = new Map();

export const presenceService = {
  markOnline(userId) {
    onlineUsers.set(String(userId), { status: 'online', lastActiveAt: new Date() });
  },
  markOffline(userId) {
    onlineUsers.set(String(userId), { status: 'offline', lastActiveAt: new Date() });
  },
  get(userId) {
    return onlineUsers.get(String(userId)) || { status: 'offline', lastActiveAt: null };
  },
  snapshot() {
    return Object.fromEntries(onlineUsers.entries());
  },
};
