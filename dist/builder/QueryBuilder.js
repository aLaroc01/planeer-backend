"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../errors/AppError"));
class QueryBuilder {
    modelQuery;
    query;
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    search(searchableFields) {
        const searchTerm = this.query?.searchTerm;
        if (searchTerm) {
            this.modelQuery = this.modelQuery.find({
                $or: searchableFields.map((field) => ({
                    [field]: { $regex: searchTerm, $options: 'i' },
                })),
            });
        }
        return this;
    }
    filter() {
        const excludeFields = ['searchTerm', 'sort', 'limit', 'page', 'fields'];
        const queryObj = { ...this.query };
        excludeFields.forEach((el) => delete queryObj[el]);
        this.modelQuery = this.modelQuery.find(queryObj);
        return this;
    }
    sort() {
        const sort = this.query?.sort?.split(',')?.join(' ') || '-createdAt';
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    paginate(defaultLimit = 10) {
        const page = Number(this.query?.page) || 1;
        const limit = Number(this.query?.limit) || defaultLimit;
        const skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit).sort();
        return this;
    }
    fields() {
        const fields = this.query?.fields?.split(',')?.join(' ') || '-__v';
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    priceRange() {
        const priceFilter = {};
        const minPrice = this.query?.minPrice;
        const maxPrice = this.query?.maxPrice;
        if (minPrice !== undefined)
            priceFilter.$gte = minPrice;
        if (maxPrice !== undefined)
            priceFilter.$lte = maxPrice;
        if (minPrice !== undefined || maxPrice !== undefined) {
            this.modelQuery = this.modelQuery.find({
                price: priceFilter,
            });
        }
        return this;
    }
    async countTotal() {
        try {
            const totalQueries = this.modelQuery.getFilter();
            const total = await this.modelQuery.model.countDocuments(totalQueries);
            const page = Number(this.query?.page) || 1;
            const limit = Number(this.query?.limit) || 10;
            const totalPage = Math.ceil(total / limit);
            return { page, limit, total, totalPage };
        }
        catch (error) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, error);
        }
    }
}
exports.default = QueryBuilder;
