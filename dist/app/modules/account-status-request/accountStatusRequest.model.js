"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountStatusRequest = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("../auth/user.interface");
const accountStatusRequest_interface_1 = require("./accountStatusRequest.interface");
const accountStatusRequestSchema = new mongoose_1.Schema({
    targetUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    requestedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    fromStatus: {
        type: String,
        enum: Object.values(user_interface_1.AccountStatus),
        required: true,
    },
    requestedStatus: {
        type: String,
        enum: [
            user_interface_1.AccountStatus.ACTIVE,
            user_interface_1.AccountStatus.SUSPENDED,
            user_interface_1.AccountStatus.DEACTIVATED,
        ],
        required: true,
    },
    internalNote: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 2000,
    },
    status: {
        type: String,
        enum: Object.values(accountStatusRequest_interface_1.AccountStatusRequestStatus),
        default: accountStatusRequest_interface_1.AccountStatusRequestStatus.PENDING,
        required: true,
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    reviewNote: {
        type: String,
        trim: true,
        minlength: 10,
        maxlength: 2000,
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
accountStatusRequestSchema.index({ targetUserId: 1 }, {
    unique: true,
    partialFilterExpression: {
        status: accountStatusRequest_interface_1.AccountStatusRequestStatus.PENDING,
    },
    name: "one_pending_status_request_per_user",
});
accountStatusRequestSchema.index({
    status: 1,
    createdAt: -1,
});
accountStatusRequestSchema.index({
    requestedBy: 1,
    createdAt: -1,
});
exports.AccountStatusRequest = (0, mongoose_1.model)("AccountStatusRequest", accountStatusRequestSchema);
