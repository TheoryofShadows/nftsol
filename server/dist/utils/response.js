"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedResponse = exports.errorResponse = exports.successResponse = void 0;
const constants_1 = require("../config/constants");
const successResponse = (res, data, status = constants_1.HTTP_CODES.OK, meta) => {
    return res.status(status).json({
        ok: true,
        data,
        ...(meta && { meta })
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, message, status = constants_1.HTTP_CODES.INTERNAL_SERVER_ERROR, details) => {
    return res.status(status).json({
        ok: false,
        error: message,
        ...(details && { details })
    });
};
exports.errorResponse = errorResponse;
const paginatedResponse = (res, data, page, limit, total) => {
    return (0, exports.successResponse)(res, data, constants_1.HTTP_CODES.OK, {
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
};
exports.paginatedResponse = paginatedResponse;
