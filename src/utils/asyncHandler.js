// Wrapper for async route handlers to catch errors automatically
const asyncHandler = (fn) => {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch((err) => {
      if (typeof next === 'function') {
        return next(err);
      }
      // No next provided (called directly in tests) - rethrow so caller can catch
      throw err;
    });
  };
};

module.exports = asyncHandler;
