"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userService_1 = require("../services/userService");
const router = express_1.default.Router();
const userService = new userService_1.UserService();
/**
 * Create a new user profile
 */
router.post('/create', async (req, res) => {
    try {
        const { walletAddress, ...profileData } = req.body;
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Wallet address is required'
            });
        }
        const result = await userService.createUser(walletAddress, profileData);
        if (result.success) {
            res.json({
                success: true,
                user: result.user
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get user profile
 */
router.get('/profile/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const result = await userService.getUserProfile(walletAddress);
        if (result.success) {
            res.json({
                success: true,
                user: result.user
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Update user profile
 */
router.put('/profile/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const updates = req.body;
        const result = await userService.updateUserProfile(walletAddress, updates);
        if (result.success) {
            res.json({
                success: true,
                user: result.user
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get user activity
 */
router.get('/activity/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const result = await userService.getUserActivity(walletAddress, limit);
        if (result.success) {
            res.json({
                success: true,
                activities: result.activities
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get user reputation
 */
router.get('/reputation/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const result = await userService.getUserReputation(walletAddress);
        if (result.success) {
            res.json({
                success: true,
                reputation: result.reputation
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Get user reputation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Follow a user
 */
router.post('/follow', async (req, res) => {
    try {
        const { followerWallet, targetWallet } = req.body;
        if (!followerWallet || !targetWallet) {
            return res.status(400).json({
                success: false,
                error: 'Both follower and target wallet addresses are required'
            });
        }
        const result = await userService.followUser(followerWallet, targetWallet);
        if (result.success) {
            res.json({
                success: true,
                message: 'User followed successfully'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Unfollow a user
 */
router.post('/unfollow', async (req, res) => {
    try {
        const { followerWallet, targetWallet } = req.body;
        if (!followerWallet || !targetWallet) {
            return res.status(400).json({
                success: false,
                error: 'Both follower and target wallet addresses are required'
            });
        }
        const result = await userService.unfollowUser(followerWallet, targetWallet);
        if (result.success) {
            res.json({
                success: true,
                message: 'User unfollowed successfully'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Unfollow user error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get user followers
 */
router.get('/followers/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const result = await userService.getUserFollowers(walletAddress);
        if (result.success) {
            res.json({
                success: true,
                followers: result.followers
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Get user followers error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get user following
 */
router.get('/following/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const result = await userService.getUserFollowing(walletAddress);
        if (result.success) {
            res.json({
                success: true,
                following: result.following
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Get user following error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
