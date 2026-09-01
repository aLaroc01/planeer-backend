"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./app/config");
async function main() {
    await mongoose_1.default.connect(config_1.config.db_uri);
    app_1.default.listen(config_1.config.port, () => {
        console.log(`Server is running on port ${config_1.config.port}`);
    });
}
main().then(() => console.log("MongoDB connected successfully!")).catch((error) => {
    console.error("Error connecting to the database:", error);
});
