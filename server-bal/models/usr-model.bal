// User model
public type User record {
    int id;
    string userName;
    string email;
    string nic;
    string mobileNo;
    string? evm;
};

// Petition model
public type Petition record {
    int id;
    string title;
    string description;
    int requiredSignatureCount;
    int signatureCount;
    int creatorId;
};

// Category model
public type Category record {
    int id;
    string categoryName;
    decimal allocatedBudget;
    decimal spentBudget;
};

// Project model
public type Project record {
    int id;
    string projectName;
    int categoryId;
    decimal allocatedBudget;
    decimal spentBudget;
    string state;
    string province;
    string ministry;
    string? viewDetails;
};

// Transaction model
public type Transaction record {
    int id;
    int categoryId;
    string time;
    decimal spent;
    decimal allocated;
};

// Proposal model
public type Proposal record {
    int id;
    string title;
    string shortDescription;
    string description;
    boolean activeStatus;
    string expiredDate;
    int yesVotes;
    int noVotes;
    int categoryId;
};

// Policy model
public type Policy record {
    int id;
    string name;
    string description;
    string viewFullPolicy;
    string ministry;
    string createdTime;
};

// PolicyComment model
public type PolicyComment record {
    int id;
    int userId;
    int policyId;
    string comment;
    int likes;
    int? replyId;
    string? replyComment;
};

// Report model
public type Report record {
    int id;
    string reportTitle;
    string createdTime;
    string lastUpdatedTime;
    string priority;
    string assignedTo;
    string evidenceHash;
    boolean resolvedStatus;
    int? userId;
};

// PetitionActivity model
public type PetitionActivity record {
    int id;
    string date;
    int count;
    int petitionId;
};

// Request/Response types
public type CreateUserRequest record {
    string userName;
    string email;
    string nic;
    string mobileNo;
    string? evm;
};

public type UpdateUserRequest record {
    string? userName;
    string? email;
    string? nic;
    string? mobileNo;
    string? evm;
};

public type CreatePetitionRequest record {
    string title;
    string description;
    int requiredSignatureCount;
    int creatorId;
};

public type CreateCategoryRequest record {
    string categoryName;
    decimal allocatedBudget;
};

public type CreateProjectRequest record {
    string projectName;
    int categoryId;
    decimal allocatedBudget;
    string state;
    string province;
    string ministry;
    string? viewDetails;
};

public type CreateProposalRequest record {
    string title;
    string shortDescription;
    string description;
    boolean activeStatus;
    string expiredDate;
    int categoryId;
};

public type CreatePolicyRequest record {
    string name;
    string description;
    string viewFullPolicy;
    string ministry;
};

public type CreatePolicyCommentRequest record {
    int userId;
    int policyId;
    string comment;
    int? replyId;
    string? replyComment;
};

public type CreateReportRequest record {
    string reportTitle;
    string priority;
    string assignedTo;
    string evidenceHash;
    int? userId;
};

// API Response types
public type ApiResponse<T> record {
    boolean success;
    string message;
    T? data;
    string? error;
};

public type PaginatedResponse<T> record {
    boolean success;
    string message;
    T[] data;
    int total;
    int page;
    int limit;
    string? error;
};
