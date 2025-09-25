const { makeInMemoryStore } = require('./make-in-memory-store');

module.exports = {
  makeInMemoryStore
};

// ESM compatibility for named import
exports.makeInMemoryStore = makeInMemoryStore;
exports.default = { makeInMemoryStore };
