"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const web3_js_1 = require("@solana/web3.js");
const environment_1 = require("../config/environment");
class UserService {
    constructor() {
        this.heliusConfig = (0, environment_1.getHeliusConfig)();
        this.connection = new web3_js_1.Connection(this.heliusConfig.rpcUrl, 'confirmed');
    }
    /**
     * Create a new user profile
     */
    async createUser(walletAddress, profileData) {
        try {
            // Validate wallet address
            new web3_js_1.PublicKey(walletAddress);
            const user = {
                walletAddress,
                username: profileData.username || `user_${walletAddress.slice(0, 8)}`,
                displayName: profileData.displayName || 'Anonymous User',
                bio: profileData.bio || '',
                avatar: profileData.avatar || '',
                socialLinks: profileData.socialLinks || {},
                preferences: {
                    notifications: true,
                    privacy: 'public',
                    theme: 'auto',
                    ...profileData.preferences
                },
                stats: {
                    totalNfts: 0,
                    totalSales: 0,
                    totalPurchases: 0,
                    cloutEarned: 0,
                    trustScore: 0,
                    joinDate: new Date().toISOString(),
                    ...profileData.stats
                },
                badges: [],
                followers: [],
                following: []
            };
            // Store user profile (in a real implementation, this would be stored in a database)
            // For now, we'll use in-memory storage for CI/testing
            console.log(`✅ User profile created for ${walletAddress}`);
            return {
                success: true,
                user
            };
        }
        catch (error) {
            console.error('Failed to create user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get user profile by wallet address
     */
    async getUserProfile(walletAddress) {
        try {
            // Validate wallet address
            new web3_js_1.PublicKey(walletAddress);
            // In a real implementation, this would fetch from database
            // For now, return a mock profile
            const user = {
                walletAddress,
                username: `user_${walletAddress.slice(0, 8)}`,
                displayName: 'Anonymous User',
                bio: 'New to NFTSol!',
                avatar: '',
                socialLinks: {},
                preferences: {
                    notifications: true,
                    privacy: 'public',
                    theme: 'auto'
                },
                stats: {
                    totalNfts: 0,
                    totalSales: 0,
                    totalPurchases: 0,
                    cloutEarned: 0,
                    trustScore: 0,
                    joinDate: new Date().toISOString()
                },
                badges: ['new_user'],
                followers: [],
                following: []
            };
            return {
                success: true,
                user
            };
        }
        catch (error) {
            console.error('Failed to get user profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Update user profile
     */
    async updateUserProfile(walletAddress, updates) {
        try {
            // Get current profile
            const currentProfile = await this.getUserProfile(walletAddress);
            if (!currentProfile.success || !currentProfile.user) {
                throw new Error('User profile not found');
            }
            // Merge updates
            const updatedUser = {
                ...currentProfile.user,
                ...updates,
                walletAddress, // Ensure wallet address can't be changed
                stats: {
                    ...currentProfile.user.stats,
                    ...updates.stats
                }
            };
            console.log(`✅ User profile updated for ${walletAddress}`);
            return {
                success: true,
                user: updatedUser
            };
        }
        catch (error) {
            console.error('Failed to update user profile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get user activity feed
     */
    async getUserActivity(walletAddress, limit = 20) {
        try {
            // In a real implementation, this would fetch from database
            const activities = [
                {
                    id: '1',
                    type: 'mint',
                    description: 'Minted a new NFT',
                    timestamp: new Date().toISOString(),
                    nftMint: 'mock_nft_mint'
                },
                {
                    id: '2',
                    type: 'clout_earned',
                    description: 'Earned 50 CLOUT tokens',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    cloutAmount: 50
                }
            ];
            return {
                success: true,
                activities: activities.slice(0, limit)
            };
        }
        catch (error) {
            console.error('Failed to get user activity:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get user reputation/trust score
     */
    async getUserReputation(walletAddress) {
        try {
            const profile = await this.getUserProfile(walletAddress);
            if (!profile.success || !profile.user) {
                throw new Error('User profile not found');
            }
            const trustScore = profile.user.stats.trustScore;
            let level = 'Newcomer';
            let nextLevel = 'Trusted';
            let progress = 0;
            if (trustScore >= 100) {
                level = 'Legendary';
                nextLevel = 'Max Level';
                progress = 100;
            }
            else if (trustScore >= 80) {
                level = 'Elite';
                nextLevel = 'Legendary';
                progress = (trustScore - 80) / 20 * 100;
            }
            else if (trustScore >= 60) {
                level = 'Expert';
                nextLevel = 'Elite';
                progress = (trustScore - 60) / 20 * 100;
            }
            else if (trustScore >= 40) {
                level = 'Trusted';
                nextLevel = 'Expert';
                progress = (trustScore - 40) / 20 * 100;
            }
            else if (trustScore >= 20) {
                level = 'Rising';
                nextLevel = 'Trusted';
                progress = (trustScore - 20) / 20 * 100;
            }
            else {
                level = 'Newcomer';
                nextLevel = 'Rising';
                progress = trustScore / 20 * 100;
            }
            return {
                success: true,
                reputation: {
                    trustScore,
                    level,
                    badges: profile.user.badges,
                    nextLevel,
                    progress
                }
            };
        }
        catch (error) {
            console.error('Failed to get user reputation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Follow a user
     */
    async followUser(followerWallet, targetWallet) {
        try {
            // In a real implementation, this would update the database
            console.log(`✅ ${followerWallet} is now following ${targetWallet}`);
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Failed to follow user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Unfollow a user
     */
    async unfollowUser(followerWallet, targetWallet) {
        try {
            // In a real implementation, this would update the database
            console.log(`✅ ${followerWallet} unfollowed ${targetWallet}`);
            return {
                success: true
            };
        }
        catch (error) {
            console.error('Failed to unfollow user:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get user's followers
     */
    async getUserFollowers(walletAddress) {
        try {
            // In a real implementation, this would fetch from database
            const followers = [];
            return {
                success: true,
                followers
            };
        }
        catch (error) {
            console.error('Failed to get user followers:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Get user's following
     */
    async getUserFollowing(walletAddress) {
        try {
            // In a real implementation, this would fetch from database
            const following = [];
            return {
                success: true,
                following
            };
        }
        catch (error) {
            console.error('Failed to get user following:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
exports.UserService = UserService;
