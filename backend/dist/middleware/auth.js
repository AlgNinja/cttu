"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClerkAuth = void 0;
const express_1 = require("@clerk/express");
const requireClerkAuth = (req, res, next) => {
    try {
        const auth = (0, express_1.getAuth)(req);
        if (!auth || !auth.userId) {
            // In development mode, if user is testing before pasting keys, allow test user header if explicitly enabled
            if (process.env.ALLOW_DEV_GUEST === 'true' && req.headers['x-dev-user-id']) {
                req.clerkUserId = req.headers['x-dev-user-id'];
                return next();
            }
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Valid Clerk session token is required to access this resource.',
            });
            return;
        }
        req.clerkUserId = auth.userId;
        return next();
    }
    catch (err) {
        console.error('Clerk Auth Middleware Error:', err);
        res.status(401).json({
            error: 'Authentication failed',
            message: err.message || 'Failed to authenticate user with Clerk',
        });
    }
};
exports.requireClerkAuth = requireClerkAuth;
