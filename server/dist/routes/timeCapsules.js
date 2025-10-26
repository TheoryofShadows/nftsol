"use strict";
/**
 * ⏰ Time Capsule Sales Routes
 * API endpoints for revolutionary time-locked NFT sales
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timeCapsuleSales_1 = require("../services/timeCapsuleSales");
const router = (0, express_1.Router)();
const timeCapsuleService = new timeCapsuleSales_1.TimeCapsuleSalesService();
// Create a time capsule sale
router.post('/create', async (req, res) => {
    try {
        const { mint, seller, price, currency, releaseDate, partialPayment, metadata } = req.body;
        if (!mint || !seller || !price || !currency || !releaseDate || !metadata) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        console.log(`⏰ Creating time capsule sale for ${mint}`);
        const sale = await timeCapsuleService.createTimeCapsuleSale({
            mint,
            seller,
            price,
            currency,
            releaseDate,
            partialPayment,
            metadata
        });
        res.json({
            success: true,
            sale: sale,
            message: 'Time capsule sale created successfully'
        });
    }
    catch (error) {
        console.error('❌ Error creating time capsule sale:', error);
        res.status(500).json({
            success: false,
            error: `Failed to create time capsule sale: ${error.message}`
        });
    }
});
// Reserve a time capsule sale
router.post('/reserve/:saleId', async (req, res) => {
    try {
        const { saleId } = req.params;
        const { buyer } = req.body;
        if (!buyer) {
            return res.status(400).json({
                success: false,
                error: 'Buyer address is required'
            });
        }
        console.log(`🎯 Reserving time capsule sale ${saleId} for buyer ${buyer}`);
        const reservation = await timeCapsuleService.reserveTimeCapsuleSale(saleId, buyer);
        res.json({
            success: true,
            reservation: reservation,
            message: 'Time capsule sale reserved successfully'
        });
    }
    catch (error) {
        console.error('❌ Error reserving time capsule sale:', error);
        res.status(500).json({
            success: false,
            error: `Failed to reserve time capsule sale: ${error.message}`
        });
    }
});
// Release a time capsule
router.post('/release/:saleId', async (req, res) => {
    try {
        const { saleId } = req.params;
        console.log(`🚀 Releasing time capsule sale ${saleId}`);
        const success = await timeCapsuleService.releaseTimeCapsule(saleId);
        res.json({
            success: success,
            message: success ? 'Time capsule released successfully' : 'Failed to release time capsule'
        });
    }
    catch (error) {
        console.error('❌ Error releasing time capsule:', error);
        res.status(500).json({
            success: false,
            error: `Failed to release time capsule: ${error.message}`
        });
    }
});
// Get active time capsule sales
router.get('/active', async (req, res) => {
    try {
        console.log('📋 Getting active time capsule sales');
        const sales = await timeCapsuleService.getActiveTimeCapsuleSales();
        res.json({
            success: true,
            sales: sales,
            count: sales.length
        });
    }
    catch (error) {
        console.error('❌ Error getting active time capsule sales:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get active time capsule sales: ${error.message}`
        });
    }
});
// Get time capsule sales by seller
router.get('/seller/:address', async (req, res) => {
    try {
        const { address } = req.params;
        console.log(`📋 Getting time capsule sales for seller: ${address}`);
        const sales = await timeCapsuleService.getTimeCapsuleSalesBySeller(address);
        res.json({
            success: true,
            seller: address,
            sales: sales,
            count: sales.length
        });
    }
    catch (error) {
        console.error('❌ Error getting seller time capsule sales:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get seller time capsule sales: ${error.message}`
        });
    }
});
// Get time capsule sales by buyer
router.get('/buyer/:address', async (req, res) => {
    try {
        const { address } = req.params;
        console.log(`📋 Getting time capsule sales for buyer: ${address}`);
        const sales = await timeCapsuleService.getTimeCapsuleSalesByBuyer(address);
        res.json({
            success: true,
            buyer: address,
            sales: sales,
            count: sales.length
        });
    }
    catch (error) {
        console.error('❌ Error getting buyer time capsule sales:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get buyer time capsule sales: ${error.message}`
        });
    }
});
// Get time capsule sales by collection
router.get('/collection/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        console.log(`📋 Getting time capsule sales for collection: ${collection}`);
        const sales = await timeCapsuleService.getTimeCapsuleSalesByCollection(collection);
        res.json({
            success: true,
            collection: collection,
            sales: sales,
            count: sales.length
        });
    }
    catch (error) {
        console.error('❌ Error getting collection time capsule sales:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get collection time capsule sales: ${error.message}`
        });
    }
});
// Cancel a time capsule sale
router.post('/cancel/:saleId', async (req, res) => {
    try {
        const { saleId } = req.params;
        const { requester } = req.body;
        if (!requester) {
            return res.status(400).json({
                success: false,
                error: 'Requester address is required'
            });
        }
        console.log(`❌ Cancelling time capsule sale ${saleId}`);
        const success = await timeCapsuleService.cancelTimeCapsuleSale(saleId, requester);
        res.json({
            success: success,
            message: success ? 'Time capsule sale cancelled successfully' : 'Failed to cancel time capsule sale'
        });
    }
    catch (error) {
        console.error('❌ Error cancelling time capsule sale:', error);
        res.status(500).json({
            success: false,
            error: `Failed to cancel time capsule sale: ${error.message}`
        });
    }
});
// Get upcoming releases
router.get('/upcoming', async (req, res) => {
    try {
        const { hours = 24 } = req.query;
        console.log(`⏰ Getting upcoming releases in the next ${hours} hours`);
        const sales = await timeCapsuleService.getUpcomingReleases(parseInt(hours));
        res.json({
            success: true,
            hours: parseInt(hours),
            sales: sales,
            count: sales.length
        });
    }
    catch (error) {
        console.error('❌ Error getting upcoming releases:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get upcoming releases: ${error.message}`
        });
    }
});
// Get time capsule statistics
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Getting time capsule statistics');
        const stats = await timeCapsuleService.getTimeCapsuleStats();
        res.json({
            success: true,
            stats: stats
        });
    }
    catch (error) {
        console.error('❌ Error getting time capsule statistics:', error);
        res.status(500).json({
            success: false,
            error: `Failed to get time capsule statistics: ${error.message}`
        });
    }
});
exports.default = router;
