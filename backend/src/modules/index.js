const User = require("./users/user.model");
const Admin = require("./admins/admin.model");
const Driver = require("./drivers/driver.model");
const Delivery = require("./deliveries/delivery.model");
const DeliveryRequest = require("./deliveries/deliveryRequest.model");
require("./deliveries/deliveryOrderSequence.model");
const DriverSettlement = require("./settlements/driverSettlement.model");
const UserWalletTransaction = require("./wallet/userWalletTransaction.model");
require("./settings/settings.model");

User.hasOne(Driver, { foreignKey: "user_id" });
Driver.belongsTo(User, { foreignKey: "user_id" });


// const User = require("../users/user.model");
// const Driver = require("../drivers/driver.model");
// const Delivery = require("./delivery.model");

User.hasMany(Delivery, { foreignKey: "user_id" });
Driver.hasMany(Delivery, { foreignKey: "driver_id" });

Delivery.belongsTo(User, { foreignKey: "user_id" });
Delivery.belongsTo(Driver, { foreignKey: "driver_id" });


// const Delivery = require("./deliveries/delivery.model");
// const DeliveryRequest = require("./deliveries/deliveryRequest.model");
// const Driver = require("./drivers/driver.model");

Delivery.hasMany(DeliveryRequest, { foreignKey: "delivery_id" });
DeliveryRequest.belongsTo(Delivery, { foreignKey: "delivery_id" });

Driver.hasMany(DeliveryRequest, { foreignKey: "driver_id" });
DeliveryRequest.belongsTo(Driver, { foreignKey: "driver_id" });

Driver.hasMany(DriverSettlement, { foreignKey: "driver_id" });
DriverSettlement.belongsTo(Driver, { foreignKey: "driver_id" });
User.hasMany(DriverSettlement, { foreignKey: "created_by" });
DriverSettlement.belongsTo(User, { foreignKey: "created_by", as: "CreatedBy" });

User.hasMany(UserWalletTransaction, { foreignKey: "user_id" });
UserWalletTransaction.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(UserWalletTransaction, { foreignKey: "created_by" });
UserWalletTransaction.belongsTo(User, { foreignKey: "created_by", as: "WalletCreatedBy" });
Delivery.hasMany(UserWalletTransaction, { foreignKey: "delivery_id" });
UserWalletTransaction.belongsTo(Delivery, { foreignKey: "delivery_id" });
