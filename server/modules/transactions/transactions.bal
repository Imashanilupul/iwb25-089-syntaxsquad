import ballerina/http;
import ballerina/log;
import ballerina/time;

# Transactions service for handling transaction operations
public class TransactionsService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;

    # Initialize transactions service
    #
    # + supabaseClient - Database client instance
    # + port - Port number for the service
    # + supabaseUrl - Supabase URL
    # + supabaseServiceRoleKey - Supabase service role key
    public function init(http:Client supabaseClient, int port, string supabaseUrl, string supabaseServiceRoleKey) {
        self.supabaseClient = supabaseClient;
        self.port = port;
        self.supabaseUrl = supabaseUrl; 
        self.supabaseServiceRoleKey = supabaseServiceRoleKey;
        log:printInfo("✅ Transactions service initialized");
    }

    # Get headers for HTTP requests with optional prefer header
    #
    # + includePrefer - Whether to include Prefer header for POST/PUT operations
    # + return - Headers map
    public function getHeaders(boolean includePrefer = false) returns map<string> {
        map<string> headers = {
            "apikey": self.supabaseServiceRoleKey,
            "Authorization": "Bearer " + self.supabaseServiceRoleKey,
            "Content-Type": "application/json"
        };
        
        if includePrefer {
            headers["Prefer"] = "return=representation";
        }
        
        return headers;
    }

    # Get all transactions
    #
    # + return - Transactions list or error
    public function getAllTransactions() returns json|error {
        do {
            map<string> headers = self.getHeaders();

            http:Response response = check self.supabaseClient->get("/rest/v1/transactions?select=*,categories(category_name),projects(project_name)&order=transaction_date.desc", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get transactions: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Transactions retrieved successfully",
                "data": transactions,
                "count": transactions.length(),
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get transactions: " + e.message());
        }
    }

    # Get transaction by ID
    #
    # + transactionId - Transaction ID to retrieve
    # + return - Transaction data or error
    public function getTransactionById(int transactionId) returns json|error {
        // Validate input
        if transactionId <= 0 {
            return error("Transaction ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?transaction_id=eq." + transactionId.toString() + "&select=*,categories(category_name),projects(project_name)";
            
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get transaction: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            if transactions.length() > 0 {
                return {
                    "success": true,
                    "message": "Transaction retrieved successfully",
                    "data": transactions[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return error("Transaction not found");
            }
            
        } on fail error e {
            return error("Failed to get transaction: " + e.message());
        }
    }

    # Create a new transaction
    #
    # + amount - Transaction amount
    # + transactionType - Transaction type
    # + description - Transaction description (optional)
    # + categoryId - Category ID (optional)
    # + projectId - Project ID (optional)
    # + return - Created transaction data or error
    public function createTransaction(decimal amount, string transactionType, string? description = (), int? categoryId = (), int? projectId = ()) returns json|error {
        do {
            // Validate input
            if amount <= 0d {
                return error("Transaction amount must be positive");
            }
            
            // Validate transaction type
            string[] validTypes = ["EXPENSE", "ALLOCATION", "REFUND"];
            boolean isValidType = false;
            foreach string validType in validTypes {
                if transactionType == validType {
                    isValidType = true;
                    break;
                }
            }
            if !isValidType {
                return error("Invalid transaction type. Allowed values: EXPENSE, ALLOCATION, REFUND");
            }
            
            json payload = {
                "amount": amount,
                "transaction_type": transactionType
            };
            
            // Add optional fields if provided
            if categoryId is int {
                payload = check payload.mergeJson({"category_id": categoryId});
            }
            
            if projectId is int {
                payload = check payload.mergeJson({"project_id": projectId});
            }
            
            if description is string {
                payload = check payload.mergeJson({"description": description});
            }

            map<string> headers = self.getHeaders(true); // Include Prefer header
            http:Response response = check self.supabaseClient->post("/rest/v1/transactions", payload, headers);
            
            if response.statusCode == 201 {
                // Check if response has content
                json|error result = response.getJsonPayload();
                if result is error {
                    return {
                        "success": true,
                        "message": "Transaction created successfully",
                        "data": payload,
                        "timestamp": time:utcNow()[0]
                    };
                } else {
                    json[] transactions = check result.ensureType();
                    if transactions.length() > 0 {
                        return {
                            "success": true,
                            "message": "Transaction created successfully",
                            "data": transactions[0],
                            "timestamp": time:utcNow()[0]
                        };
                    } else {
                        return {
                            "success": true,
                            "message": "Transaction created successfully",
                            "data": payload,
                            "timestamp": time:utcNow()[0]
                        };
                    }
                }
            } else {
                return error("Failed to create transaction: " + response.statusCode.toString());
            }

        } on fail error e {
            return error("Failed to create transaction: " + e.message());
        }
    }

    # Update transaction by ID
    #
    # + transactionId - Transaction ID to update
    # + updateData - Update data as JSON
    # + return - Updated transaction data or error
    public function updateTransaction(int transactionId, json updateData) returns json|error {
        // Validate input
        if transactionId <= 0 {
            return error("Transaction ID must be a positive integer");
        }
        
        do {
            map<json> payloadMap = {};
            
            // Build update payload from provided data
            json|error amount = updateData.amount;
            if amount is json {
                decimal|error amountDec = amount.ensureType(decimal);
                if amountDec is decimal && amountDec > 0d {
                    payloadMap["amount"] = amountDec;
                } else {
                    return error("Amount must be a positive number");
                }
            }
            
            json|error transactionType = updateData.transactionType;
            if transactionType is json {
                string|error typeStr = transactionType.ensureType(string);
                if typeStr is string {
                    string[] validTypes = ["EXPENSE", "ALLOCATION", "REFUND"];
                    boolean isValidType = false;
                    foreach string validType in validTypes {
                        if typeStr == validType {
                            isValidType = true;
                            break;
                        }
                    }
                    if !isValidType {
                        return error("Invalid transaction type. Allowed values: EXPENSE, ALLOCATION, REFUND");
                    }
                    payloadMap["transaction_type"] = typeStr;
                }
            }
            
            json|error description = updateData.description;
            if description is json {
                string|error descStr = description.ensureType(string);
                if descStr is string {
                    payloadMap["description"] = descStr;
                }
            }
            
            json|error categoryId = updateData.categoryId;
            if categoryId is json {
                int|error catId = categoryId.ensureType(int);
                if catId is int {
                    payloadMap["category_id"] = catId;
                }
            }
            
            json|error projectId = updateData.projectId;
            if projectId is json {
                int|error projId = projectId.ensureType(int);
                if projId is int {
                    payloadMap["project_id"] = projId;
                }
            }
            
            if payloadMap.length() == 0 {
                return error("No valid fields provided for update");
            }
            
            json payload = payloadMap;
            
            map<string> headers = self.getHeaders(true); // Include Prefer header
            string endpoint = "/rest/v1/transactions?transaction_id=eq." + transactionId.toString();
            http:Response response = check self.supabaseClient->patch(endpoint, payload, headers);
            
            if response.statusCode != 200 {
                return error("Failed to update transaction: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            if transactions.length() > 0 {
                return {
                    "success": true,
                    "message": "Transaction updated successfully",
                    "data": transactions[0],
                    "timestamp": time:utcNow()[0]
                };
            } else {
                return {
                    "success": true,
                    "message": "Transaction updated successfully",
                    "data": payload,
                    "timestamp": time:utcNow()[0]
                };
            }
            
        } on fail error e {
            return error("Failed to update transaction: " + e.message());
        }
    }

    # Delete transaction by ID
    #
    # + transactionId - Transaction ID to delete
    # + return - Success message or error
    public function deleteTransaction(int transactionId) returns json|error {
        // Validate input
        if transactionId <= 0 {
            return error("Transaction ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?transaction_id=eq." + transactionId.toString();
            http:Response response = check self.supabaseClient->delete(endpoint, (), headers);
            
            if response.statusCode != 200 && response.statusCode != 204 {
                return error("Failed to delete transaction: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Transaction deleted successfully",
                "transactionId": transactionId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to delete transaction: " + e.message());
        }
    }

    # Get transactions by category
    #
    # + categoryId - Category ID to filter by
    # + return - Transactions list or error
    public function getTransactionsByCategory(int categoryId) returns json|error {
        // Validate input
        if categoryId <= 0 {
            return error("Category ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?category_id=eq." + categoryId.toString() + "&select=*,categories(category_name),projects(project_name)&order=transaction_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get transactions by category: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Transactions retrieved successfully by category",
                "data": transactions,
                "count": transactions.length(),
                "categoryId": categoryId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get transactions by category: " + e.message());
        }
    }

    # Get transactions by project
    #
    # + projectId - Project ID to filter by
    # + return - Transactions list or error
    public function getTransactionsByProject(int projectId) returns json|error {
        // Validate input
        if projectId <= 0 {
            return error("Project ID must be a positive integer");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?project_id=eq." + projectId.toString() + "&select=*,categories(category_name),projects(project_name)&order=transaction_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get transactions by project: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Transactions retrieved successfully by project",
                "data": transactions,
                "count": transactions.length(),
                "projectId": projectId,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get transactions by project: " + e.message());
        }
    }

    # Get transactions by type
    #
    # + transactionType - Transaction type to filter by
    # + return - Transactions list or error
    public function getTransactionsByType(string transactionType) returns json|error {
        // Validate transaction type
        string[] validTypes = ["EXPENSE", "ALLOCATION", "REFUND"];
        boolean isValidType = false;
        foreach string validType in validTypes {
            if transactionType == validType {
                isValidType = true;
                break;
            }
        }
        if !isValidType {
            return error("Invalid transaction type. Allowed values: EXPENSE, ALLOCATION, REFUND");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?transaction_type=eq." + transactionType + "&select=*,categories(category_name),projects(project_name)&order=transaction_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get transactions by type: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Transactions retrieved successfully by type",
                "data": transactions,
                "count": transactions.length(),
                "transactionType": transactionType,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get transactions by type: " + e.message());
        }
    }

    # Get transactions by date range
    #
    # + startDate - Start date (YYYY-MM-DD format)
    # + endDate - End date (YYYY-MM-DD format)
    # + return - Transactions list or error
    public function getTransactionsByDateRange(string startDate, string endDate) returns json|error {
        // Basic date format validation
        if startDate.trim().length() == 0 || endDate.trim().length() == 0 {
            return error("Start date and end date cannot be empty");
        }
        
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?transaction_date=gte." + startDate + "&transaction_date=lte." + endDate + "&select=*,categories(category_name),projects(project_name)&order=transaction_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get transactions by date range: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Transactions retrieved successfully by date range",
                "data": transactions,
                "count": transactions.length(),
                "dateRange": {
                    "startDate": startDate,
                    "endDate": endDate
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get transactions by date range: " + e.message());
        }
    }

    # Get transaction statistics
    #
    # + return - Transaction statistics or error
    public function getTransactionStatistics() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            http:Response response = check self.supabaseClient->get("/rest/v1/transactions?select=*", headers);
            
            if response.statusCode != 200 {
                return error("Failed to get transaction statistics: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            // Initialize counters
            map<int> typeCounts = {};
            map<decimal> typeAmounts = {};
            int totalTransactions = transactions.length();
            decimal totalAmount = 0d;
            
            foreach json transactionItem in transactions {
                if transactionItem is map<json> {
                    // Count by type and sum amounts
                    json|error typeJson = transactionItem["transaction_type"];
                    json|error amountJson = transactionItem["amount"];
                    
                    if typeJson is json && amountJson is json {
                        string transactionType = typeJson.toString();
                        decimal|error amount = amountJson.ensureType(decimal);
                        
                        if amount is decimal {
                            typeCounts[transactionType] = (typeCounts[transactionType] ?: 0) + 1;
                            typeAmounts[transactionType] = (typeAmounts[transactionType] ?: 0d) + amount;
                            totalAmount += amount;
                        }
                    }
                }
            }
            
            return {
                "success": true,
                "message": "Transaction statistics retrieved successfully",
                "data": {
                    "totalTransactions": totalTransactions,
                    "totalAmount": totalAmount,
                    "typeBreakdown": {
                        "counts": typeCounts,
                        "amounts": typeAmounts
                    },
                    "averageTransactionAmount": totalTransactions > 0 ? totalAmount / totalTransactions : 0d
                },
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get transaction statistics: " + e.message());
        }
    }

    # Search transactions by description
    #
    # + keyword - Keyword to search for in transaction description
    # + return - Matching transactions or error
    public function searchTransactions(string keyword) returns json|error {
        // Validate input
        if keyword.trim().length() == 0 {
            return error("Search keyword cannot be empty");
        }
        
        do {
            // Search in description field
            string searchTerm = "%" + keyword + "%";
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?description.ilike." + searchTerm + "&select=*,categories(category_name),projects(project_name)&order=transaction_date.desc";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to search transactions: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Transaction search completed successfully",
                "data": transactions,
                "count": transactions.length(),
                "keyword": keyword,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to search transactions: " + e.message());
        }
    }

    # Validate transaction data
    #
    # + transactionData - Transaction data to validate
    # + return - Validation result
    public function validateTransactionData(json transactionData) returns json {
        string[] errors = [];
        
        json|error amount = transactionData.amount;
        if amount is error {
            errors.push("Amount is required");
        } else {
            decimal|error amountDec = amount.ensureType(decimal);
            if amountDec is error || amountDec <= 0d {
                errors.push("Amount must be a positive number");
            }
        }
        
        json|error transactionType = transactionData.transactionType;
        if transactionType is error {
            errors.push("Transaction type is required");
        } else {
            string|error typeStr = transactionType.ensureType(string);
            if typeStr is string {
                string[] validTypes = ["EXPENSE", "ALLOCATION", "REFUND"];
                boolean isValidType = false;
                foreach string validType in validTypes {
                    if typeStr == validType {
                        isValidType = true;
                        break;
                    }
                }
                if !isValidType {
                    errors.push("Invalid transaction type. Allowed values: EXPENSE, ALLOCATION, REFUND");
                }
            } else {
                errors.push("Transaction type must be a string");
            }
        }
        
        return {
            "valid": errors.length() == 0,
            "errors": errors
        };
    }

    # Get recent transactions (last 30 days)
    #
    # + return - Recent transactions list or error
    public function getRecentTransactions() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            string endpoint = "/rest/v1/transactions?transaction_date=gte.now()-interval'30 days'&select=*,categories(category_name),projects(project_name)&order=transaction_date.desc&limit=50";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            if response.statusCode != 200 {
                return error("Failed to get recent transactions: " + response.statusCode.toString());
            }
            
            json result = check response.getJsonPayload();
            json[] transactions = check result.ensureType();
            
            return {
                "success": true,
                "message": "Recent transactions retrieved successfully",
                "data": transactions,
                "count": transactions.length(),
                "period": "Last 30 days",
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            return error("Failed to get recent transactions: " + e.message());
        }
    }
}
