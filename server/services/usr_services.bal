import ballerina/sql;
import ballerinax/postgresql;

// Type definitions (copied from models for proper compilation)
public type User record {
    int id;
    string userName;
    string email;
    string nic;
    string mobileNo;
    string? evm;
};

public type CreateUserRequest record {
    string userName;
    string email;
    string nic;
    string mobileNo;
    string? evm;
};

public type Category record {
    int id;
    string categoryName;
    decimal allocatedBudget;
    decimal spentBudget;
};

public type CreateCategoryRequest record {
    string categoryName;
    decimal allocatedBudget;
};

public type Petition record {
    int id;
    string title;
    string description;
    int requiredSignatureCount;
    int signatureCount;
    int creatorId;
};

public type CreatePetitionRequest record {
    string title;
    string description;
    int requiredSignatureCount;
    int creatorId;
};

// Database client function
function getDbClient() returns postgresql:Client|error {
    postgresql:Client dbClient = check new (
        host = "db.hhnxsixgjcdhvzuwbmzf.supabase.co",
        port = 5432,
        database = "postgres",
        username = "postgres",
        password = "SrilankaHackathon@2024",
        options = {
            ssl: {
                mode: "REQUIRE"
            }
        }
    );
    
    return dbClient;
}

// User Services
public function createUser(CreateUserRequest userData) returns User|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `INSERT INTO users (user_name, email, nic, mobile_no, evm) 
                                   VALUES (${userData.userName}, ${userData.email}, ${userData.nic}, ${userData.mobileNo}, ${userData.evm}) 
                                   RETURNING id, user_name, email, nic, mobile_no, evm`;
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(query);
    record {|record {} value;|}? result = check resultStream.next();
    check resultStream.close();
    check dbClient.close();
    
    if result is record {|record {} value;|} {
        User user = {
            id: <int>result.value["id"],
            userName: <string>result.value["user_name"],
            email: <string>result.value["email"],
            nic: <string>result.value["nic"],
            mobileNo: <string>result.value["mobile_no"],
            evm: <string?>result.value["evm"]
        };
        
        return user;
    } else {
        return error("Failed to create user");
    }
}

public function getUserById(int userId) returns User|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `SELECT id, user_name, email, nic, mobile_no, evm FROM users WHERE id = ${userId}`;
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(query);
    record {|record {} value;|}? result = check resultStream.next();
    check resultStream.close();
    check dbClient.close();
    
    if result is record {|record {} value;|} {
        User user = {
            id: <int>result.value["id"],
            userName: <string>result.value["user_name"],
            email: <string>result.value["email"],
            nic: <string>result.value["nic"],
            mobileNo: <string>result.value["mobile_no"],
            evm: <string?>result.value["evm"]
        };
        
        return user;
    } else {
        return error("User not found");
    }
}

public function getAllUsers() returns User[]|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `SELECT id, user_name, email, nic, mobile_no, evm FROM users ORDER BY id`;
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(query);
    User[] users = [];
    
    check resultStream.forEach(function(record {} userRecord) {
        User user = {
            id: <int>userRecord["id"],
            userName: <string>userRecord["user_name"],
            email: <string>userRecord["email"],
            nic: <string>userRecord["nic"],
            mobileNo: <string>userRecord["mobile_no"],
            evm: <string?>userRecord["evm"]
        };
        users.push(user);
    });
    
    check dbClient.close();
    return users;
}

public function deleteUser(int userId) returns string|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `DELETE FROM users WHERE id = ${userId}`;
    sql:ExecutionResult result = check dbClient->execute(query);
    check dbClient.close();
    
    if result.affectedRowCount > 0 {
        return "User deleted successfully";
    } else {
        return error("User not found");
    }
}

// Category Services
public function createCategory(CreateCategoryRequest categoryData) returns Category|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `INSERT INTO categories (category_name, allocated_budget, spent_budget) 
                                   VALUES (${categoryData.categoryName}, ${categoryData.allocatedBudget}, 0) 
                                   RETURNING category_id, category_name, allocated_budget, spent_budget`;
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(query);
    record {|record {} value;|}? result = check resultStream.next();
    check resultStream.close();
    check dbClient.close();
    
    if result is record {|record {} value;|} {
        Category category = {
            id: <int>result.value["category_id"],
            categoryName: <string>result.value["category_name"],
            allocatedBudget: <decimal>result.value["allocated_budget"],
            spentBudget: <decimal>result.value["spent_budget"]
        };
        
        return category;
    } else {
        return error("Failed to create category");
    }
}

public function getAllCategories() returns Category[]|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `SELECT category_id, category_name, allocated_budget, spent_budget FROM categories ORDER BY category_id`;
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(query);
    Category[] categories = [];
    
    check resultStream.forEach(function(record {} categoryRecord) {
        Category category = {
            id: <int>categoryRecord["category_id"],
            categoryName: <string>categoryRecord["category_name"],
            allocatedBudget: <decimal>categoryRecord["allocated_budget"],
            spentBudget: <decimal>categoryRecord["spent_budget"]
        };
        categories.push(category);
    });
    
    check dbClient.close();
    return categories;
}

// Petition Services
public function createPetition(CreatePetitionRequest petitionData) returns Petition|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `INSERT INTO petitions (title, description, required_signature_count, creator_id, signature_count) 
                                   VALUES (${petitionData.title}, ${petitionData.description}, ${petitionData.requiredSignatureCount}, ${petitionData.creatorId}, 0) 
                                   RETURNING id, title, description, required_signature_count, signature_count, creator_id`;
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(query);
    record {|record {} value;|}? result = check resultStream.next();
    check resultStream.close();
    check dbClient.close();
    
    if result is record {|record {} value;|} {
        Petition petition = {
            id: <int>result.value["id"],
            title: <string>result.value["title"],
            description: <string>result.value["description"],
            requiredSignatureCount: <int>result.value["required_signature_count"],
            signatureCount: <int>result.value["signature_count"],
            creatorId: <int>result.value["creator_id"]
        };
        
        return petition;
    } else {
        return error("Failed to create petition");
    }
}

public function getAllPetitions() returns Petition[]|error {
    postgresql:Client dbClient = check getDbClient();
    
    sql:ParameterizedQuery query = `SELECT id, title, description, required_signature_count, signature_count, creator_id FROM petitions ORDER BY id`;
    
    stream<record {}, sql:Error?> resultStream = dbClient->query(query);
    Petition[] petitions = [];
    
    check resultStream.forEach(function(record {} petitionRecord) {
        Petition petition = {
            id: <int>petitionRecord["id"],
            title: <string>petitionRecord["title"],
            description: <string>petitionRecord["description"],
            requiredSignatureCount: <int>petitionRecord["required_signature_count"],
            signatureCount: <int>petitionRecord["signature_count"],
            creatorId: <int>petitionRecord["creator_id"]
        };
        petitions.push(petition);
    });
    
    check dbClient.close();
    return petitions;
}
