"use strict";
/**
 * ⏰ Time Capsule Sales Service
 * Revolutionary time-locked NFT sales system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeCapsuleSalesService = void 0;
const web3_js_1 = require("@solana/web3.js");
const environment_1 = require("../config/environment");
class TimeCapsuleSalesService {
    constructor() {
        this.sales = new Map();
        this.reservations = new Map();
        this.heliusConfig = (0, environment_1.getHeliusConfig)();
        this.connection = new web3_js_1.Connection(this.heliusConfig.rpcUrl, 'confirmed');
    }
    /**
     * Create a time capsule sale
     */
    async createTimeCapsuleSale(saleData) {
        console.log(`⏰ Creating time capsule sale for ${saleData.mint}`);
        const saleId = this.generateSaleId();
        const now = Date.now();
        // Validate release date is in the future
        if (saleData.releaseDate <= now) {
            throw new Error('Release date must be in the future');
        }
        // Validate partial payment percentage
        if (saleData.partialPayment < 0 || saleData.partialPayment > 100) {
            throw new Error('Partial payment must be between 0 and 100 percent');
        }
        const sale = {
            id: saleId,
            mint: saleData.mint,
            seller: saleData.seller,
            price: saleData.price,
            currency: saleData.currency,
            releaseDate: saleData.releaseDate,
            partialPayment: saleData.partialPayment,
            status: 'active',
            createdAt: now,
            metadata: saleData.metadata
        };
        this.sales.set(saleId, sale);
        console.log(`✅ Time capsule sale created: ${saleId}`);
        console.log(`📅 Release date: ${new Date(saleData.releaseDate).toISOString()}`);
        console.log(`💰 Price: ${saleData.price} ${saleData.currency}`);
        console.log(`💳 Partial payment: ${saleData.partialPayment}%`);
        return sale;
    }
    /**
     * Reserve a time capsule sale
     */
    async reserveTimeCapsuleSale(saleId, buyer) {
        console.log(`🎯 Reserving time capsule sale ${saleId} for buyer ${buyer}`);
        const sale = this.sales.get(saleId);
        if (!sale) {
            throw new Error('Time capsule sale not found');
        }
        if (sale.status !== 'active') {
            throw new Error('Time capsule sale is not available for reservation');
        }
        if (sale.seller === buyer) {
            throw new Error('Cannot reserve your own time capsule sale');
        }
        const reservationId = this.generateReservationId();
        const now = Date.now();
        const partialAmount = (sale.price * sale.partialPayment) / 100;
        const fullAmount = sale.price;
        const reservation = {
            id: reservationId,
            saleId: saleId,
            buyer: buyer,
            partialAmount: partialAmount,
            fullAmount: fullAmount,
            reservedAt: now,
            releaseDate: sale.releaseDate,
            status: 'active'
        };
        // Update sale status
        sale.buyer = buyer;
        sale.status = 'reserved';
        sale.reservedAt = now;
        this.reservations.set(reservationId, reservation);
        this.sales.set(saleId, sale);
        console.log(`✅ Time capsule sale reserved: ${reservationId}`);
        console.log(`💰 Partial payment: ${partialAmount} ${sale.currency}`);
        console.log(`📅 Release date: ${new Date(sale.releaseDate).toISOString()}`);
        return reservation;
    }
    /**
     * Release a time capsule (when release date is reached)
     */
    async releaseTimeCapsule(saleId) {
        console.log(`🚀 Releasing time capsule sale ${saleId}`);
        const sale = this.sales.get(saleId);
        if (!sale) {
            throw new Error('Time capsule sale not found');
        }
        if (sale.status !== 'reserved') {
            throw new Error('Time capsule sale is not reserved');
        }
        const now = Date.now();
        if (now < sale.releaseDate) {
            throw new Error('Release date has not been reached yet');
        }
        // Update sale status
        sale.status = 'released';
        sale.releasedAt = now;
        // Update reservation status
        const reservation = Array.from(this.reservations.values())
            .find(r => r.saleId === saleId);
        if (reservation) {
            reservation.status = 'completed';
            this.reservations.set(reservation.id, reservation);
        }
        this.sales.set(saleId, sale);
        console.log(`✅ Time capsule released: ${saleId}`);
        console.log(`🎉 NFT transferred to buyer: ${sale.buyer}`);
        return true;
    }
    /**
     * Get all active time capsule sales
     */
    async getActiveTimeCapsuleSales() {
        const activeSales = Array.from(this.sales.values())
            .filter(sale => sale.status === 'active');
        console.log(`📋 Found ${activeSales.length} active time capsule sales`);
        return activeSales;
    }
    /**
     * Get time capsule sales by seller
     */
    async getTimeCapsuleSalesBySeller(seller) {
        const sellerSales = Array.from(this.sales.values())
            .filter(sale => sale.seller === seller);
        console.log(`📋 Found ${sellerSales.length} time capsule sales for seller ${seller}`);
        return sellerSales;
    }
    /**
     * Get time capsule sales by buyer
     */
    async getTimeCapsuleSalesByBuyer(buyer) {
        const buyerSales = Array.from(this.sales.values())
            .filter(sale => sale.buyer === buyer);
        console.log(`📋 Found ${buyerSales.length} time capsule sales for buyer ${buyer}`);
        return buyerSales;
    }
    /**
     * Get time capsule sales by collection
     */
    async getTimeCapsuleSalesByCollection(collection) {
        const collectionSales = Array.from(this.sales.values())
            .filter(sale => sale.metadata.collection === collection);
        console.log(`📋 Found ${collectionSales.length} time capsule sales for collection ${collection}`);
        return collectionSales;
    }
    /**
     * Cancel a time capsule sale
     */
    async cancelTimeCapsuleSale(saleId, requester) {
        console.log(`❌ Cancelling time capsule sale ${saleId}`);
        const sale = this.sales.get(saleId);
        if (!sale) {
            throw new Error('Time capsule sale not found');
        }
        if (sale.seller !== requester) {
            throw new Error('Only the seller can cancel the time capsule sale');
        }
        if (sale.status === 'released') {
            throw new Error('Cannot cancel a released time capsule sale');
        }
        // Update sale status
        sale.status = 'cancelled';
        this.sales.set(saleId, sale);
        // Update reservation status if exists
        const reservation = Array.from(this.reservations.values())
            .find(r => r.saleId === saleId);
        if (reservation) {
            reservation.status = 'cancelled';
            this.reservations.set(reservation.id, reservation);
        }
        console.log(`✅ Time capsule sale cancelled: ${saleId}`);
        return true;
    }
    /**
     * Get upcoming releases (for notifications)
     */
    async getUpcomingReleases(hoursAhead = 24) {
        const now = Date.now();
        const futureTime = now + (hoursAhead * 60 * 60 * 1000);
        const upcomingSales = Array.from(this.sales.values())
            .filter(sale => sale.status === 'reserved' &&
            sale.releaseDate > now &&
            sale.releaseDate <= futureTime);
        console.log(`⏰ Found ${upcomingSales.length} time capsule sales releasing in the next ${hoursAhead} hours`);
        return upcomingSales;
    }
    /**
     * Get time capsule statistics
     */
    async getTimeCapsuleStats() {
        const allSales = Array.from(this.sales.values());
        const stats = {
            totalSales: allSales.length,
            activeSales: allSales.filter(s => s.status === 'active').length,
            reservedSales: allSales.filter(s => s.status === 'reserved').length,
            releasedSales: allSales.filter(s => s.status === 'released').length,
            totalVolume: allSales.reduce((sum, sale) => sum + sale.price, 0),
            averagePrice: allSales.length > 0 ? allSales.reduce((sum, sale) => sum + sale.price, 0) / allSales.length : 0
        };
        console.log(`📊 Time capsule statistics:`, stats);
        return stats;
    }
    /**
     * Generate unique sale ID
     */
    generateSaleId() {
        return `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique reservation ID
     */
    generateReservationId() {
        return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.TimeCapsuleSalesService = TimeCapsuleSalesService;
