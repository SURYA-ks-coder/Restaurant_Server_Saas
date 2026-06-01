const BaseRepository = require("../../../repositories/BaseRepository");
const TableReservation = require("../models/TableReservation.model");

class TableReservationRepository extends BaseRepository {
  constructor() {
    super(TableReservation);
  }
}

module.exports = new TableReservationRepository();
