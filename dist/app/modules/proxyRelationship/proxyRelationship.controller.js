"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeEmergencyRelease = exports.reviewEmergencyRelease = exports.requestEmergencyRelease = exports.deleteProxyRelationship = exports.updateProxyRelationship = exports.getProxyRelationshipById = exports.getProxyRelationships = exports.createProxyRelationship = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const proxyRelationship_interface_1 = __importDefault(require("./proxyRelationship.interface"));
const validStatus = ["active", "inactive", "pending", "disabled"];
const validReleaseStatus = ["active", "pending-release", "released", "rejected"];
const createProxyRelationship = async (req, res) => {
    try {
        const payload = req.body;
        const relationship = await proxyRelationship_interface_1.default.create({
            relationshipLabel: payload.relationshipLabel ?? "",
            email: payload.email ?? "",
            phoneNumber: payload.phoneNumber ?? "",
            status: payload.status ?? "active",
            emergencyAccessEnabled: payload.emergencyAccessEnabled ?? false,
            release: {
                status: payload.release?.status ?? "active",
                requestedAt: payload.release?.requestedAt ?? null,
                reviewedAt: payload.release?.reviewedAt ?? null,
                reviewedBy: payload.release?.reviewedBy ? new mongoose_1.default.Types.ObjectId(payload.release.reviewedBy) : null,
                reason: payload.release?.reason ?? "",
                evidenceNote: payload.release?.evidenceNote ?? "",
                releasedAt: payload.release?.releasedAt ?? null,
                expiresAt: payload.release?.expiresAt ?? null,
                revokedAt: payload.release?.revokedAt ?? null,
            },
            permissions: {
                medical: payload.permissions?.medical ?? false,
                financial: payload.permissions?.financial ?? false,
                homeAuto: payload.permissions?.homeAuto ?? false,
                social: payload.permissions?.social ?? false,
            },
            notes: payload.notes ?? "",
            lastActivityAt: payload.lastActivityAt ?? null,
        });
        return res.status(201).json(relationship);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.createProxyRelationship = createProxyRelationship;
const getProxyRelationships = async (_req, res) => {
    try {
        const relationships = await proxyRelationship_interface_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json(relationships);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getProxyRelationships = getProxyRelationships;
const getProxyRelationshipById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const relationship = await proxyRelationship_interface_1.default.findById(id);
        if (!relationship) {
            return res.status(404).json({ error: "Relationship not found" });
        }
        return res.status(200).json(relationship);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getProxyRelationshipById = getProxyRelationshipById;
const updateProxyRelationship = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const payload = req.body;
        const relationship = await proxyRelationship_interface_1.default.findById(id);
        if (!relationship) {
            return res.status(404).json({ error: "Relationship not found" });
        }
        if (payload.relationshipLabel !== undefined)
            relationship.relationshipLabel = payload.relationshipLabel;
        if (payload.email !== undefined)
            relationship.email = payload.email;
        if (payload.phoneNumber !== undefined)
            relationship.phoneNumber = payload.phoneNumber;
        if (payload.status !== undefined)
            relationship.status = payload.status;
        if (payload.emergencyAccessEnabled !== undefined)
            relationship.emergencyAccessEnabled = payload.emergencyAccessEnabled;
        if (payload.notes !== undefined)
            relationship.notes = payload.notes;
        if (payload.lastActivityAt !== undefined)
            relationship.lastActivityAt = payload.lastActivityAt;
        if (payload.permissions) {
            relationship.permissions = {
                medical: payload.permissions.medical ?? relationship.permissions.medical,
                financial: payload.permissions.financial ?? relationship.permissions.financial,
                homeAuto: payload.permissions.homeAuto ?? relationship.permissions.homeAuto,
                social: payload.permissions.social ?? relationship.permissions.social,
            };
        }
        if (payload.release) {
            relationship.release.status = payload.release.status ?? relationship.release.status;
            relationship.release.requestedAt = payload.release.requestedAt ?? relationship.release.requestedAt;
            relationship.release.reviewedAt = payload.release.reviewedAt ?? relationship.release.reviewedAt;
            relationship.release.reviewedBy = payload.release.reviewedBy
                ? new mongoose_1.default.Types.ObjectId(payload.release.reviewedBy)
                : relationship.release.reviewedBy;
            relationship.release.reason = payload.release.reason ?? relationship.release.reason;
            relationship.release.evidenceNote = payload.release.evidenceNote ?? relationship.release.evidenceNote;
            relationship.release.releasedAt = payload.release.releasedAt ?? relationship.release.releasedAt;
            relationship.release.expiresAt = payload.release.expiresAt ?? relationship.release.expiresAt;
            relationship.release.revokedAt = payload.release.revokedAt ?? relationship.release.revokedAt;
        }
        await relationship.save();
        return res.status(200).json(relationship);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.updateProxyRelationship = updateProxyRelationship;
const deleteProxyRelationship = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const deleted = await proxyRelationship_interface_1.default.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: "Relationship not found" });
        }
        return res.status(200).json({ message: "Deleted successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.deleteProxyRelationship = deleteProxyRelationship;
const requestEmergencyRelease = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, evidenceNote } = req.body;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const relationship = await proxyRelationship_interface_1.default.findById(id);
        if (!relationship) {
            return res.status(404).json({ error: "Relationship not found" });
        }
        if (!relationship.emergencyAccessEnabled) {
            return res.status(400).json({ error: "Emergency access is not enabled" });
        }
        relationship.release.status = "pending-release";
        relationship.release.requestedAt = new Date();
        relationship.release.reason = reason ?? relationship.release.reason;
        relationship.release.evidenceNote = evidenceNote ?? relationship.release.evidenceNote;
        relationship.lastActivityAt = new Date();
        await relationship.save();
        return res.status(200).json(relationship);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.requestEmergencyRelease = requestEmergencyRelease;
const reviewEmergencyRelease = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, reviewedBy, reason, evidenceNote, expiresAt } = req.body;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const relationship = await proxyRelationship_interface_1.default.findById(id);
        if (!relationship) {
            return res.status(404).json({ error: "Relationship not found" });
        }
        relationship.release.reviewedAt = new Date();
        relationship.release.reviewedBy = reviewedBy ? new mongoose_1.default.Types.ObjectId(reviewedBy) : relationship.release.reviewedBy;
        relationship.release.reason = reason ?? relationship.release.reason;
        relationship.release.evidenceNote = evidenceNote ?? relationship.release.evidenceNote;
        relationship.release.status = approved ? "released" : "rejected";
        relationship.release.releasedAt = approved ? new Date() : null;
        relationship.release.expiresAt = approved && expiresAt ? new Date(expiresAt) : relationship.release.expiresAt;
        relationship.lastActivityAt = new Date();
        await relationship.save();
        return res.status(200).json(relationship);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.reviewEmergencyRelease = reviewEmergencyRelease;
const revokeEmergencyRelease = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid id" });
        }
        const relationship = await proxyRelationship_interface_1.default.findById(id);
        if (!relationship) {
            return res.status(404).json({ error: "Relationship not found" });
        }
        relationship.release.status = "active";
        relationship.release.revokedAt = new Date();
        relationship.release.expiresAt = null;
        relationship.lastActivityAt = new Date();
        await relationship.save();
        return res.status(200).json(relationship);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.revokeEmergencyRelease = revokeEmergencyRelease;
