const BaseRepository = require("../../../repositories/BaseRepository");
const User = require("../models/User.model");

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmailForAuth(email) {
    const filter = {
      email: String(email || "").toLowerCase().trim(),
      isDeleted: false,
    };
    return User.findOne(filter).select(
      "+password +refreshTokenHash +tokenVersion +passwordResetTokenHash +passwordResetExpiresAt",
    );
  }

  findByRefreshPayload(userId) {
    return User.findOne({
      _id: userId,
      isDeleted: false,
      status: "active",
    }).select("+refreshTokenHash +tokenVersion");
  }
}

module.exports = new UserRepository();
