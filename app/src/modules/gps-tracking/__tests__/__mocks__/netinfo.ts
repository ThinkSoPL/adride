// Mock @react-native-community/netinfo
const mockNetInfo = {
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  addEventListener: jest.fn().mockReturnValue(jest.fn()), // zwraca funkcję unsubscribe
};

export default mockNetInfo;
