import ballerina/regexp;
import ballerina/log;

// Validation functions
public function validateEmail(string email) returns boolean {
    string emailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
    return regexp:matches(email, emailPattern);
}

public function validateNIC(string nic) returns boolean {
    // Sri Lankan NIC validation (old format: 9 digits, new format: 12 digits)
    string oldNICPattern = "^[0-9]{9}$";
    string newNICPattern = "^[0-9]{12}$";
    
    return regexp:matches(nic, oldNICPattern) || regexp:matches(nic, newNICPattern);
}

public function validateMobileNumber(string mobileNo) returns boolean {
    // Sri Lankan mobile number validation
    string mobilePattern = "^[0-9]{10}$";
    return regexp:matches(mobileNo, mobilePattern);
}

public function validateRequiredFields(record {} data, string[] requiredFields) returns string? {
    foreach string field in requiredFields {
        if (!data.hasKey(field) || data[field] is ()) {
            return "Field '" + field + "' is required";
        }
    }
    return;
}

// Error handling functions
public function createErrorResponse(string message, string? error = ()) returns record {
    return {
        success: false,
        message: message,
        error: error
    };
}

public function createSuccessResponse<T>(string message, T data) returns record {
    return {
        success: true,
        message: message,
        data: data
    };
}

// Pagination helper
public function calculatePagination(int page, int limit, int total) returns record {
    int totalPages = (total + limit - 1) / limit;
    int offset = (page - 1) * limit;
    
    return {
        page: page,
        limit: limit,
        total: total,
        totalPages: totalPages,
        offset: offset,
        hasNext: page < totalPages,
        hasPrev: page > 1
    };
}

// Date/Time utilities
public function formatDateTime(string dateTime) returns string {
    // Convert ISO string to readable format
    return dateTime.replace("T", " ").replace("Z", "");
}

// Logging utilities
public function logApiRequest(string method, string path, string? userId = ()) {
    log:printInfo("API Request: " + method + " " + path + (userId is string ? " (User: " + userId + ")" : ""));
}

public function logApiResponse(string method, string path, int statusCode) {
    log:printInfo("API Response: " + method + " " + path + " - " + statusCode.toString());
}

// Database utilities
public function handleDatabaseError(error dbError) returns record {
    log:printError("Database error: " + dbError.message());
    
    return {
        success: false,
        message: "Database operation failed",
        error: "Internal server error"
    };
}
