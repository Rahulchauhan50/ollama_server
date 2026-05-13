const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');

const getAdminStatus = asyncHandler(async (req, res) => {
  const response = new ApiResponse(
    200,
    'Admin API available',
    {
      status: 'admin_access_granted',
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
    }
  );
  res.status(200).json(response);
});

module.exports = {
  getAdminStatus,
};
