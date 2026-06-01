const BaseRepository = require("../../../repositories/BaseRepository");
const QrOrder = require("../QrOrder.model");

class QrOrderRepository extends BaseRepository {
  constructor() {
    super(QrOrder);
  }
}

module.exports = new QrOrderRepository();
