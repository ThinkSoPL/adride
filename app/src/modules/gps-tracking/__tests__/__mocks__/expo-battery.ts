// Mock expo-battery
export const BatteryState = { Unknown: 0, Unplugged: 1, Charging: 2, Full: 3 };
export const getBatteryLevelAsync = jest.fn().mockResolvedValue(0.85);
export const getBatteryStateAsync = jest.fn().mockResolvedValue(1); // Unplugged
export const addBatteryLevelListener = jest.fn().mockReturnValue({ remove: jest.fn() });
export const addBatteryStateListener = jest.fn().mockReturnValue({ remove: jest.fn() });
