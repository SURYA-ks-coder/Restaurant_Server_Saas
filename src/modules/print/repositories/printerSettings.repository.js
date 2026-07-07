const BaseRepository = require("../../../repositories/BaseRepository");
const PrinterSettings = require("../models/PrinterSettings.model");

class PrinterSettingsRepository extends BaseRepository {
  constructor() {
    super(PrinterSettings);
  }
}

module.exports = new PrinterSettingsRepository();
