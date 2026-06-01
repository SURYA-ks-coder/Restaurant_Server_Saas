const parsePagination = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const parseSort = (query, allowed = ["createdAt"]) => {
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : "createdAt";
  const order = query.sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: order };
};

const paginationMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1
});

module.exports = { parsePagination, parseSort, paginationMeta };
