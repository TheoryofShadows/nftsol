import { UserService } from '../../src/services/userService';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  describe('createUser', () => {
    it('should create a user profile successfully', async () => {
      const walletAddress = '11111111111111111111111111111111';
      const profileData = {
        username: 'testuser',
        displayName: 'Test User',
        bio: 'Test bio'
      };

      const result = await userService.createUser(walletAddress, profileData);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.walletAddress).toBe(walletAddress);
      expect(result.user?.username).toBe('testuser');
    });

    it('should handle invalid wallet address', async () => {
      const invalidAddress = 'invalid-address';
      const result = await userService.createUser(invalidAddress, {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const walletAddress = '11111111111111111111111111111111';
      const result = await userService.getUserProfile(walletAddress);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  describe('getUserReputation', () => {
    it('should return reputation information', async () => {
      const walletAddress = '11111111111111111111111111111111';
      const result = await userService.getUserReputation(walletAddress);

      expect(result.success).toBe(true);
      expect(result.reputation).toBeDefined();
      expect(result.reputation?.trustScore).toBeDefined();
      expect(result.reputation?.level).toBeDefined();
    });
  });
});
