import ballerina/regex;
import ballerina/log;

// Validation functions
public function validateEmail(string email) returns boolean {
    string emailPattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
    return regex:matches(email, emailPattern);
}

public function validateNIC(string nic) returns boolean {
    // Sri Lankan NIC validation (old format: 9 digits, new format: 12 digits)
    string oldNICPattern = "^[0-9]{9}$";
    string newNICPattern = "^[0-9]{12}$";
    
    return regex:matches(nic, oldNICPattern) || regex:matches(nic, newNICPattern);
}

public function validateMobileNumber(string mobileNo) returns boolean {
    // Sri Lankan mobile number validation
    string mobilePattern = "^[0-9]{10}$";
    return regex:matches(mobileNo, mobilePattern);
}

public function validateRequiredFields(record {} data, string[] requiredFields) returns string? {
    foreach string fieldName in requiredFields {
        if (!data.hasKey(fieldName) || data[fieldName] is ()) {
            return string `Field '${fieldName}' is required`;
        }
    }
    return;
}

// Error handling functions
public function createErrorResponse(string message, string? errorMsg = ()) returns record {|
    boolean success;
    string message;
    string? 'error;
|} {
    return {
        success: false,
        message: message,
        'error: errorMsg
    };
}

public function createSuccessResponse(string message, anydata data) returns record {|
    boolean success;
    string message;
    anydata data;
|} {
    return {
        success: true,
        message: message,
        data: data
    };
}

// Pagination helper
public function calculatePagination(int page, int pageLimit, int total) returns record {|
    int page;
    int 'limit;
    int total;
    int totalPages;
    int offset;
    boolean hasNext;
    boolean hasPrev;
|} {
    int totalPages = (total + pageLimit - 1) / pageLimit;
    int offset = (page - 1) * pageLimit;
    
    return {
        page: page,
        'limit: pageLimit,
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
    string result = regex:replaceAll(dateTime, "T", " ");
    result = regex:replaceAll(result, "Z", "");
    return result;
}

// Logging utilities
public function logApiRequest(string method, string path, string? userId = ()) {
    string userInfo = userId is string ? string ` (User: ${userId})` : "";
    log:printInfo(string `API Request: ${method} ${path}${userInfo}`);
}

public function logApiResponse(string method, string path, int statusCode) {
    log:printInfo(string `API Response: ${method} ${path} - ${statusCode}`);
}

// Database utilities
public function handleDatabaseError(error dbError) returns record {|
    boolean success;
    string message;
    string 'error;
|} {
    log:printError(string `Database error: ${dbError.message()}`);
    
    return {
        success: false,
        message: "Database operation failed",
        'error: "Internal server error"
    };
}
