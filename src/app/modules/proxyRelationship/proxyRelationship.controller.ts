import { Request, Response } from "express";
import mongoose from "mongoose";
import ProxyRelationship, { IProxyRelationship } from "./proxyRelationship.interface";

const validStatus = ["active", "inactive", "pending", "disabled"] as const;
const validReleaseStatus = ["active", "pending-release", "released", "rejected"] as const;

type Status = (typeof validStatus)[number];
type ReleaseStatus = (typeof validReleaseStatus)[number];

type ReleasePatch = Partial<{
  status: ReleaseStatus;
  requestedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reason: string;
  evidenceNote: string;
  releasedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
}>;

type ProxyPatch = Partial<{
  relationshipLabel: string;
  email: string;
  phoneNumber: string;
  status: Status;
  emergencyAccessEnabled: boolean;
  release: ReleasePatch;
  permissions: Partial<IProxyRelationship["permissions"]>;
  notes: string;
  lastActivityAt: Date | null;
}>;

export const createProxyRelationship = async (req: Request, res: Response) => {
  try {
    const payload: ProxyPatch = req.body;

    const relationship = await ProxyRelationship.create({
      relationshipLabel: payload.relationshipLabel ?? "",
      email: payload.email ?? "",
      phoneNumber: payload.phoneNumber ?? "",
      status: payload.status ?? "active",
      emergencyAccessEnabled: payload.emergencyAccessEnabled ?? false,
      release: {
        status: payload.release?.status ?? "active",
        requestedAt: payload.release?.requestedAt ?? null,
        reviewedAt: payload.release?.reviewedAt ?? null,
        reviewedBy: payload.release?.reviewedBy ? new mongoose.Types.ObjectId(payload.release.reviewedBy) : null,
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getProxyRelationships = async (_req: Request, res: Response) => {
  try {
    const relationships = await ProxyRelationship.find().sort({ createdAt: -1 });
    return res.status(200).json(relationships);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getProxyRelationshipById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const relationship = await ProxyRelationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    return res.status(200).json(relationship);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProxyRelationship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const payload: ProxyPatch = req.body;
    const relationship = await ProxyRelationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    if (payload.relationshipLabel !== undefined) relationship.relationshipLabel = payload.relationshipLabel;
    if (payload.email !== undefined) relationship.email = payload.email;
    if (payload.phoneNumber !== undefined) relationship.phoneNumber = payload.phoneNumber;
    if (payload.status !== undefined) relationship.status = payload.status;
    if (payload.emergencyAccessEnabled !== undefined) relationship.emergencyAccessEnabled = payload.emergencyAccessEnabled;
    if (payload.notes !== undefined) relationship.notes = payload.notes;
    if (payload.lastActivityAt !== undefined) relationship.lastActivityAt = payload.lastActivityAt;

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
        ? new mongoose.Types.ObjectId(payload.release.reviewedBy)
        : relationship.release.reviewedBy;
      relationship.release.reason = payload.release.reason ?? relationship.release.reason;
      relationship.release.evidenceNote = payload.release.evidenceNote ?? relationship.release.evidenceNote;
      relationship.release.releasedAt = payload.release.releasedAt ?? relationship.release.releasedAt;
      relationship.release.expiresAt = payload.release.expiresAt ?? relationship.release.expiresAt;
      relationship.release.revokedAt = payload.release.revokedAt ?? relationship.release.revokedAt;
    }

    await relationship.save();
    return res.status(200).json(relationship);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteProxyRelationship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const deleted = await ProxyRelationship.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const requestEmergencyRelease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, evidenceNote } = req.body as { reason?: string; evidenceNote?: string };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const relationship = await ProxyRelationship.findById(id);
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const reviewEmergencyRelease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approved, reviewedBy, reason, evidenceNote, expiresAt } = req.body as {
      approved?: boolean;
      reviewedBy?: string;
      reason?: string;
      evidenceNote?: string;
      expiresAt?: string;
    };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const relationship = await ProxyRelationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    relationship.release.reviewedAt = new Date();
    relationship.release.reviewedBy = reviewedBy ? new mongoose.Types.ObjectId(reviewedBy) : relationship.release.reviewedBy;
    relationship.release.reason = reason ?? relationship.release.reason;
    relationship.release.evidenceNote = evidenceNote ?? relationship.release.evidenceNote;
    relationship.release.status = approved ? "released" : "rejected";
    relationship.release.releasedAt = approved ? new Date() : null;
    relationship.release.expiresAt = approved && expiresAt ? new Date(expiresAt) : relationship.release.expiresAt;
    relationship.lastActivityAt = new Date();

    await relationship.save();
    return res.status(200).json(relationship);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const revokeEmergencyRelease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const relationship = await ProxyRelationship.findById(id);
    if (!relationship) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    relationship.release.status = "active";
    relationship.release.revokedAt = new Date();
    relationship.release.expiresAt = null;
    relationship.lastActivityAt = new Date();

    await relationship.save();
    return res.status(200).json(relationship);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};