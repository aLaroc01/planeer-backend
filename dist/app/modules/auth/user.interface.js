"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountStatus = exports.PlanStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["ADMIN"] = "ADMIN";
    Role["PROXY"] = "PROXY";
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
})(Role || (exports.Role = Role = {}));
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["ACTIVE"] = "ACTIVE";
    PlanStatus["TRIALING"] = "TRIALING";
    PlanStatus["FROZEN"] = "FROZEN";
    PlanStatus["ARCHIVED"] = "ARCHIVED";
    PlanStatus["SUBSCRIPTION_REQUIRED"] = "SUBSCRIPTION_REQUIRED";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "ACTIVE";
    AccountStatus["SUSPENDED"] = "SUSPENDED";
    AccountStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
    AccountStatus["DEACTIVATED"] = "DEACTIVATED";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
