import ballerina/sql;
import ballerina/log;
import ballerina/time;
import . from "../db/db-client.bal";
import * as models from "../models/usr-model.bal";

// User Services
public function createUser(models:CreateUserRequest userData) returns models:ApiResponse<models:User> {
    sql:ParameterizedQuery query = `INSERT INTO users (user_name, email, nic, mobile_no, evm) 
                                   VALUES (?, ?, ?, ?, ?) RETURNING *`;
    
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `INSERT INTO users (user_name, email, nic, mobile_no, evm) 
              VALUES (?, ?, ?, ?, ?) RETURNING *`,
        parameters: [userData.userName, userData.email, userData.nic, userData.mobileNo, userData.evm]
    };
    
    sql:ExecutionResult result = check dbClient->execute(sqlQuery);
    
    if (result.affectedRowCount > 0) {
        models:User user = {
            id: result.lastInsertId,
            userName: userData.userName,
            email: userData.email,
            nic: userData.nic,
            mobileNo: userData.mobileNo,
            evm: userData.evm
        };
        
        return {
            success: true,
            message: "User created successfully",
            data: user
        };
    } else {
        return {
            success: false,
            message: "Failed to create user",
            error: "Database error"
        };
    }
}

public function getUserById(int userId) returns models:ApiResponse<models:User> {
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `SELECT id, user_name, email, nic, mobile_no, evm FROM users WHERE id = ?`,
        parameters: [userId]
    };
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(sqlQuery);
    
    record {|models:User value;|}? result = check resultStream.next();
    
    if (result is record {|models:User value;|}) {
        return {
            success: true,
            message: "User retrieved successfully",
            data: result.value
        };
    } else {
        return {
            success: false,
            message: "User not found",
            error: "User with ID " + userId.toString() + " not found"
        };
    }
}

public function getAllUsers(int page = 1, int limit = 10) returns models:PaginatedResponse<models:User> {
    int offset = (page - 1) * limit;
    
    sql:ParameterizedCallQuery countQuery = {
        sql: `SELECT COUNT(*) as total FROM users`,
        parameters: []
    };
    
    sql:ParameterizedCallQuery dataQuery = {
        sql: `SELECT id, user_name, email, nic, mobile_no, evm 
              FROM users ORDER BY id LIMIT ? OFFSET ?`,
        parameters: [limit, offset]
    };
    
    stream<record {}, sql:Error?> countStream = dbClient->query(countQuery);
    record {|int total;|}? countResult = check countStream.next();
    
    stream<record {}, sql:Error?> dataStream = dbClient->query(dataQuery);
    models:User[] users = [];
    
    error? e = dataStream.forEach(function(record {} userRecord) {
        models:User user = {
            id: userRecord["id"],
            userName: userRecord["user_name"],
            email: userRecord["email"],
            nic: userRecord["nic"],
            mobileNo: userRecord["mobile_no"],
            evm: userRecord["evm"]
        };
        users.push(user);
    });
    
    if (e is error) {
        return {
            success: false,
            message: "Failed to retrieve users",
            data: [],
            total: 0,
            page: page,
            limit: limit,
            error: e.message()
        };
    }
    
    return {
        success: true,
        message: "Users retrieved successfully",
        data: users,
        total: countResult?.total ?: 0,
        page: page,
        limit: limit
    };
}

public function updateUser(int userId, models:UpdateUserRequest userData) returns models:ApiResponse<models:User> {
    string[] updates = [];
    any[] parameters = [];
    
    if (userData.userName is string) {
        updates.push("user_name = ?");
        parameters.push(userData.userName);
    }
    if (userData.email is string) {
        updates.push("email = ?");
        parameters.push(userData.email);
    }
    if (userData.nic is string) {
        updates.push("nic = ?");
        parameters.push(userData.nic);
    }
    if (userData.mobileNo is string) {
        updates.push("mobile_no = ?");
        parameters.push(userData.mobileNo);
    }
    if (userData.evm is string) {
        updates.push("evm = ?");
        parameters.push(userData.evm);
    }
    
    if (updates.length() == 0) {
        return {
            success: false,
            message: "No fields to update",
            error: "No valid fields provided for update"
        };
    }
    
    parameters.push(userId);
    
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `UPDATE users SET ${updates.join(", ")} WHERE id = ? RETURNING *`,
        parameters: parameters
    };
    
    sql:ExecutionResult result = check dbClient->execute(sqlQuery);
    
    if (result.affectedRowCount > 0) {
        // Fetch updated user
        models:ApiResponse<models:User> userResponse = getUserById(userId);
        return userResponse;
    } else {
        return {
            success: false,
            message: "Failed to update user",
            error: "User not found or no changes made"
        };
    }
}

public function deleteUser(int userId) returns models:ApiResponse<()> {
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `DELETE FROM users WHERE id = ?`,
        parameters: [userId]
    };
    
    sql:ExecutionResult result = check dbClient->execute(sqlQuery);
    
    if (result.affectedRowCount > 0) {
        return {
            success: true,
            message: "User deleted successfully",
            data: ()
        };
    } else {
        return {
            success: false,
            message: "Failed to delete user",
            error: "User not found"
        };
    }
}

// Petition Services
public function createPetition(models:CreatePetitionRequest petitionData) returns models:ApiResponse<models:Petition> {
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `INSERT INTO petitions (title, description, required_signature_count, creator_id, signature_count) 
              VALUES (?, ?, ?, ?, 0) RETURNING *`,
        parameters: [petitionData.title, petitionData.description, petitionData.requiredSignatureCount, petitionData.creatorId]
    };
    
    sql:ExecutionResult result = check dbClient->execute(sqlQuery);
    
    if (result.affectedRowCount > 0) {
        models:Petition petition = {
            id: result.lastInsertId,
            title: petitionData.title,
            description: petitionData.description,
            requiredSignatureCount: petitionData.requiredSignatureCount,
            signatureCount: 0,
            creatorId: petitionData.creatorId
        };
        
        return {
            success: true,
            message: "Petition created successfully",
            data: petition
        };
    } else {
        return {
            success: false,
            message: "Failed to create petition",
            error: "Database error"
        };
    }
}

public function getAllPetitions(int page = 1, int limit = 10) returns models:PaginatedResponse<models:Petition> {
    int offset = (page - 1) * limit;
    
    sql:ParameterizedCallQuery countQuery = {
        sql: `SELECT COUNT(*) as total FROM petitions`,
        parameters: []
    };
    
    sql:ParameterizedCallQuery dataQuery = {
        sql: `SELECT id, title, description, required_signature_count, signature_count, creator_id 
              FROM petitions ORDER BY id LIMIT ? OFFSET ?`,
        parameters: [limit, offset]
    };
    
    stream<record {}, sql:Error?> countStream = dbClient->query(countQuery);
    record {|int total;|}? countResult = check countStream.next();
    
    stream<record {}, sql:Error?> dataStream = dbClient->query(dataQuery);
    models:Petition[] petitions = [];
    
    error? e = dataStream.forEach(function(record {} petitionRecord) {
        models:Petition petition = {
            id: petitionRecord["id"],
            title: petitionRecord["title"],
            description: petitionRecord["description"],
            requiredSignatureCount: petitionRecord["required_signature_count"],
            signatureCount: petitionRecord["signature_count"],
            creatorId: petitionRecord["creator_id"]
        };
        petitions.push(petition);
    });
    
    if (e is error) {
        return {
            success: false,
            message: "Failed to retrieve petitions",
            data: [],
            total: 0,
            page: page,
            limit: limit,
            error: e.message()
        };
    }
    
    return {
        success: true,
        message: "Petitions retrieved successfully",
        data: petitions,
        total: countResult?.total ?: 0,
        page: page,
        limit: limit
    };
}

// Category Services
public function createCategory(models:CreateCategoryRequest categoryData) returns models:ApiResponse<models:Category> {
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `INSERT INTO categories (category_name, allocated_budget, spent_budget) 
              VALUES (?, ?, 0) RETURNING *`,
        parameters: [categoryData.categoryName, categoryData.allocatedBudget]
    };
    
    sql:ExecutionResult result = check dbClient->execute(sqlQuery);
    
    if (result.affectedRowCount > 0) {
        models:Category category = {
            id: result.lastInsertId,
            categoryName: categoryData.categoryName,
            allocatedBudget: categoryData.allocatedBudget,
            spentBudget: 0
        };
        
        return {
            success: true,
            message: "Category created successfully",
            data: category
        };
    } else {
        return {
            success: false,
            message: "Failed to create category",
            error: "Database error"
        };
    }
}

public function getAllCategories() returns models:ApiResponse<models:Category[]> {
    sql:ParameterizedCallQuery sqlQuery = {
        sql: `SELECT category_id, category_name, allocated_budget, spent_budget FROM categories ORDER BY category_id`,
        parameters: []
    };
    
    stream<record {}, sql:Error?> dataStream = dbClient->query(sqlQuery);
    models:Category[] categories = [];
    
    error? e = dataStream.forEach(function(record {} categoryRecord) {
        models:Category category = {
            id: categoryRecord["category_id"],
            categoryName: categoryRecord["category_name"],
            allocatedBudget: categoryRecord["allocated_budget"],
            spentBudget: categoryRecord["spent_budget"]
        };
        categories.push(category);
    });
    
    if (e is error) {
        return {
            success: false,
            message: "Failed to retrieve categories",
            data: [],
            error: e.message()
        };
    }
    
    return {
        success: true,
        message: "Categories retrieved successfully",
        data: categories
    };
}
