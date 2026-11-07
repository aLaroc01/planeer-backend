"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeSupportRequest = exports.listSupportRequests = exports.createSupportRequest = void 0;
const mongoose_1 = require("mongoose");
const support_request_model_1 = require("./support-request.model");
const supportRequestAcknowledgment_1 = require("../../../helpers/supportRequestAcknowledgment");
const createSupportRequest = async (req, res) => {
    try {
        const body = req.body ?? {};
        if (typeof body.email !== "string" ||
            typeof body.issue !== "string" ||
            typeof body.message !== "string" ||
            (body.phone !== undefined &&
                typeof body.phone !== "string")) {
            return res.status(400).json({
                success: false,
                message: "Invalid support request.",
            });
        }
        const email = body.email.trim().toLowerCase();
        const phone = (body.phone ?? "").trim();
        const issue = body.issue.trim();
        const message = body.message.trim();
        const validIssue = support_request_model_1.SUPPORT_ISSUES.some((allowed) => allowed === issue);
        if (!email ||
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            phone.length > 40 ||
            !validIssue ||
            !message ||
            message.length > 10000) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid email, issue category, and message of up to 10,000 characters.",
            });
        }
        // Explicit fields prevent callers from setting admin-only values.
        const request = await support_request_model_1.SupportRequest.create({
            email,
            phone,
            issue,
            message,
        });
        try {
            console.info("[support acknowledgment] Starting send", { requestId: String(request._id) });
            await (0, supportRequestAcknowledgment_1.sendSupportRequestAcknowledgment)(email);
            console.info("[support acknowledgment] Email helper completed", { requestId: String(request._id) });
        }
        catch (emailError) {
            console.error("[support acknowledgment] Email send failed:", emailError);
        }
        return res.status(201).json({
            success: true,
            message: "Your support request has been received.",
            data: {
                id: String(request._id),
                status: request.status,
            },
        });
    }
    catch (error) {
        console.error("Create support request failed:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to save your request. Please try again.",
        });
    }
};
exports.createSupportRequest = createSupportRequest;
const listSupportRequests = async (req, res) => {
    try {
        const pageInput = Number(req.query.page);
        const limitInput = Number(req.query.limit);
        const page = Number.isSafeInteger(pageInput) && pageInput > 0
            ? pageInput
            : 1;
        const limit = Number.isSafeInteger(limitInput) && limitInput > 0
            ? Math.min(limitInput, 100)
            : 20;
        const status = req.query.status;
        if (status !== undefined &&
            status !== "Open" &&
            status !== "Completed") {
            return res.status(400).json({
                success: false,
                message: "Invalid status filter.",
            });
        }
        const filter = status ? { status } : {};
        const [data, total] = await Promise.all([
            support_request_model_1.SupportRequest.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            support_request_model_1.SupportRequest.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            message: "Support requests retrieved.",
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("List support requests failed:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve support requests.",
        });
    }
};
exports.listSupportRequests = listSupportRequests;
const completeSupportRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const rawAdminId = req.user?.id;
        const adminId = req.user?.id == null ? "" : String(req.user.id);
        if (typeof adminId !== "string" ||
            !mongoose_1.Types.ObjectId.isValid(adminId)) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required.",
            });
        }
        if (typeof id !== "string" ||
            !mongoose_1.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid support request ID.",
            });
        }
        if (req.body?.status !== "Completed") {
            return res.status(400).json({
                success: false,
                message: "Only the Completed status is supported.",
            });
        }
        const updated = await support_request_model_1.SupportRequest.findOneAndUpdate({ _id: id, status: "Open" }, {
            $set: {
                status: "Completed",
                completedAt: new Date(),
                completedBy: adminId,
            },
        }, { new: true, runValidators: true }).lean();
        // Repeated requests do not overwrite completion audit fields.
        const request = updated || (await support_request_model_1.SupportRequest.findById(id).lean());
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Support request not found.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Support request completed.",
            data: request,
        });
    }
    catch (error) {
        console.error("Complete support request failed:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to complete the support request.",
        });
    }
};
exports.completeSupportRequest = completeSupportRequest;
