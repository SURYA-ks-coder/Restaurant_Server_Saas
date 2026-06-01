class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(payload, session = null) {
    return this.model.create([payload], { session }).then((docs) => docs[0]);
  }

  findById(id, projection = null) {
    return this.model.findById(id, projection);
  }

  findOne(filter, projection = null) {
    return this.model.findOne(filter, projection);
  }

  updateById(id, payload, session = null) {
    return this.model.findByIdAndUpdate(id, payload, { new: true, runValidators: true, session });
  }

  softDeleteById(id, deletedBy) {
    return this.model.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), deletedBy },
      { new: true }
    );
  }

  paginate({ filter, sort, skip, limit, populate = [] }) {
    return Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).populate(populate),
      this.model.countDocuments(filter)
    ]);
  }
}

module.exports = BaseRepository;
