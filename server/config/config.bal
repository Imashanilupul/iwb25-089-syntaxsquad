import ballerina/log;

# Database configuration type
public type DatabaseConfig record {|
    # Supabase URL
    string url;
    # Direct database connection URL
    string direct_url;
    # Database pool connection URL
    string pool_url;
    # Anonymous API key
    string anon_key;
    # Service role API key
    string service_role_key;
    # REST API endpoint
    string rest_endpoint;
    # Auth API endpoint
    string auth_endpoint;
    # Storage API endpoint
    string storage_endpoint;
|};

# Server configuration type
public type ServerConfig record {|
    # Server port number
    int port;
    # Server host address
    string host;
    # Environment name (development, production, etc.)
    string environment;
    # CORS configuration
    CorsConfig cors;
    # Logging configuration
    LoggingConfig logging;
    # Security configuration
    SecurityConfig security;
|};

# CORS configuration type
public type CorsConfig record {|
    # Whether CORS is enabled
    boolean enabled;
    # Allowed origins for CORS
    string[] allowed_origins;
    # Allowed HTTP methods for CORS
    string[] allowed_methods;
    # Allowed headers for CORS
    string[] allowed_headers;
|};

# Logging configuration type
public type LoggingConfig record {|
    # Log level (DEBUG, INFO, WARN, ERROR)
    string level;
    # Log format (json, text)
    string format;
    # Whether to enable access logs
    boolean enable_access_logs;
|};

# Security configuration type
public type SecurityConfig record {|
    # Whether rate limiting is enabled
    boolean enable_rate_limiting;
    # Maximum requests per minute
    int max_requests_per_minute;
    # Whether request validation is enabled
    boolean enable_request_validation;
|};

# Load database configuration
#
# + return - Database configuration or error
public function loadDatabaseConfig() returns DatabaseConfig|error {
    // These should be loaded from the TOML configuration files
    DatabaseConfig config = {
        url: getConfigValue("database.url", "https://hhnxsixgjcdhvzuwbmzf.supabase.co"),
        direct_url: getConfigValue("database.direct_url", ""),
        pool_url: getConfigValue("database.pool_url", ""),
        anon_key: getConfigValue("auth.anon_key", ""),
        service_role_key: getConfigValue("auth.service_role_key", ""),
        rest_endpoint: getConfigValue("api.rest_endpoint", "/rest/v1"),
        auth_endpoint: getConfigValue("api.auth_endpoint", "/auth/v1"),
        storage_endpoint: getConfigValue("api.storage_endpoint", "/storage/v1")
    };
    return config;
}

# Load server configuration
#
# + return - Server configuration or error
public function loadServerConfig() returns ServerConfig|error {
    ServerConfig config = {
        port: getConfigIntValue("port", 8080),
        host: getConfigValue("host", "localhost"),
        environment: getConfigValue("environment", "development"),
        cors: {
            enabled: getConfigBoolValue("cors.enabled", true),
            allowed_origins: getConfigArrayValue("cors.allowed_origins", ["http://localhost:3000"]),
            allowed_methods: getConfigArrayValue("cors.allowed_methods", ["GET", "POST", "PUT", "DELETE"]),
            allowed_headers: getConfigArrayValue("cors.allowed_headers", ["Content-Type", "Authorization"])
        },
        logging: {
            level: getConfigValue("logging.level", "INFO"),
            format: getConfigValue("logging.format", "json"),
            enable_access_logs: getConfigBoolValue("logging.enable_access_logs", true)
        },
        security: {
            enable_rate_limiting: getConfigBoolValue("security.enable_rate_limiting", true),
            max_requests_per_minute: getConfigIntValue("security.max_requests_per_minute", 100),
            enable_request_validation: getConfigBoolValue("security.enable_request_validation", true)
        }
    };
    return config;
}

# Get configuration value as string
#
# + key - Configuration key
# + defaultValue - Default value if key not found
# + return - Configuration value
function getConfigValue(string key, string defaultValue) returns string {
    // This would read from the TOML files in a real implementation
    // For now, returning default values
    return defaultValue;
}

# Get configuration value as integer
#
# + key - Configuration key
# + defaultValue - Default value if key not found
# + return - Configuration value
function getConfigIntValue(string key, int defaultValue) returns int {
    return defaultValue;
}

# Get configuration value as boolean
#
# + key - Configuration key
# + defaultValue - Default value if key not found
# + return - Configuration value
function getConfigBoolValue(string key, boolean defaultValue) returns boolean {
    return defaultValue;
}

# Get configuration value as string array
#
# + key - Configuration key
# + defaultValue - Default value if key not found
# + return - Configuration value
function getConfigArrayValue(string key, string[] defaultValue) returns string[] {
    return defaultValue;
}

# Initialize configuration system
#
# + return - Error if initialization fails
public function initializeConfig() returns error? {
    log:printInfo("🔧 Loading configuration...");
    
    DatabaseConfig|error dbConfig = loadDatabaseConfig();
    if dbConfig is error {
        return error("Failed to load database configuration: " + dbConfig.message());
    }
    
    ServerConfig|error serverConfig = loadServerConfig();
    if serverConfig is error {
        return error("Failed to load server configuration: " + serverConfig.message());
    }
    
    log:printInfo("✅ Configuration loaded successfully");
    return;
}
