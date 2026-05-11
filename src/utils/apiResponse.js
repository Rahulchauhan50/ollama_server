// Standard API Response class for consistent response format
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.timestamp = new Date().toISOString();
  }

  static success(data = null, message = 'Success', statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static created(data = null, message = 'Resource created') {
    return new ApiResponse(201, data, message);
  }

  static error(message = 'Internal Server Error', statusCode = 500, data = null) {
    const response = new ApiResponse(statusCode, data, message);
    response.success = false;
    return response;
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    };
  }
}

module.exports = ApiResponse;
