import ballerina/http;
import ballerina/time;
import ballerina/url;
import ballerina/log;

public class ReportsService {
    private http:Client supabaseClient;
    private int port;
    private string supabaseUrl;
    private string supabaseServiceRoleKey;


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

    public function createReport(json reportData) returns json|error {
        map<string> headers = self.getHeaders();
        http:Response response = check self.supabaseClient->post("/rest/v1/reports", reportData, headers);

        if response.statusCode != 201 {
            return error("Failed to create report: " + response.statusCode.toString());
        }

        json result = check response.getJsonPayload();
        return {
            success: true,
            message: "Report created successfully",
            data: result
        };
    }

    public function getAllReports() returns json|error {
        map<string> headers = self.getHeaders();
        string endpoint = "/rest/v1/reports?select=*&order=created_time.desc";
        http:Response response = check self.supabaseClient->get(endpoint, headers);

        if response.statusCode != 200 {
            return error("Failed to fetch reports: " + response.statusCode.toString());
        }

        json result = check response.getJsonPayload();
        json[] reports = check result.cloneWithType();
        int count = reports.length();

        return {
            success: true,
            count: count,
            data: reports
        };
    }

    public function getReportById(int id) returns json|error {
        map<string> headers = self.getHeaders();
        string endpoint = "/rest/v1/reports?id=eq." + id.toString() + "&select=*";
        http:Response response = check self.supabaseClient->get(endpoint, headers);

        if response.statusCode != 200 {
            return error("Failed to fetch report: " + response.statusCode.toString());
        }

        json result = check response.getJsonPayload();
        return {
            success: true,
            data: result
        };
    }

    public function updateReport(int id, json reportData) returns json|error {
        map<string> headers = self.getHeaders();
        string endpoint = "/rest/v1/reports?id=eq." + id.toString();
        http:Response response = check self.supabaseClient->patch(endpoint, reportData, headers);

        if response.statusCode != 200 {
            return error("Failed to update report: " + response.statusCode.toString());
        }

        json result = check response.getJsonPayload();
        return {
            success: true,
            message: "Report updated successfully",
            data: result
        };
    }

    public function deleteReport(int id) returns json|error {
        map<string> headers = self.getHeaders();
        string endpoint = "/rest/v1/reports?id=eq." + id.toString();
        http:Response response = check self.supabaseClient->delete(endpoint, headers);

        if response.statusCode != 204 {
            return error("Failed to delete report: " + response.statusCode.toString());
        }

        return {
            success: true,
            message: "Report deleted successfully"
        };
    }

    public function getReportsByUserId(int userId) returns json|error {
        map<string> headers = self.getHeaders();
        string endpoint = "/rest/v1/reports?user_id=eq." + userId.toString() + "&select=*&order=created_time.desc";
        http:Response response = check self.supabaseClient->get(endpoint, headers);

        if response.statusCode != 200 {
            return error("Failed to fetch reports by user ID: " + response.statusCode.toString());
        }

        json result = check response.getJsonPayload();
        json[] reports = check result.cloneWithType();
        int count = reports.length();

        return {
            success: true,
            count: count,
            data: reports
        };
    }

    public function getReportsByEvidenceHash(string evidenceHash) returns json|error {
        if evidenceHash.trim().length() == 0 {
            return error("Evidence hash cannot be empty");
        }

        map<string> headers = self.getHeaders();
        string safeHash = check url:encode(evidenceHash, "UTF-8");
        string endpoint = "/rest/v1/reports?evidence_hash=eq." + safeHash + "&select=*&order=created_time.desc";
        http:Response response = check self.supabaseClient->get(endpoint, headers);

        if response.statusCode != 200 {
            return error("Failed to get reports by evidence hash: " + response.statusCode.toString());
        }

        json result = check response.getJsonPayload();
        json[] reports = check result.cloneWithType();
        int count = reports.length();

        return {
            success: true,
            message: "Reports by evidence hash retrieved successfully",
            data: reports,
            count: count,
            evidenceHash: evidenceHash,
            timestamp: time:utcNow()[0]
        };
    }
}
