const { DataTypes } = require('sequelize');

// MariaDB exposes JSON columns as LONGTEXT, so the mysql2 driver does not
// auto-parse them — values come back as raw JSON strings. This helper builds a
// JSON column whose getter reliably returns the parsed value (array/object),
// whether or not the driver already parsed it.
module.exports = function jsonField(name, defaultValue) {
  return {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue,
    get() {
      const raw = this.getDataValue(name);
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch (err) {
          return defaultValue;
        }
      }
      return raw == null ? defaultValue : raw;
    },
  };
};
