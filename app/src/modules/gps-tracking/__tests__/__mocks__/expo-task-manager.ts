// Mock expo-task-manager — eliminuje błędy natywne w testach Node.js
export const defineTask = jest.fn();
export const isTaskRegisteredAsync = jest.fn().mockResolvedValue(false);
export const unregisterAllTasksAsync = jest.fn().mockResolvedValue(undefined);
