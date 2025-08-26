import ballerina/http;
import ballerina/log;
import ballerina/time;

# Simple voting activity service to avoid compiler bugs
public class VotingActivityService {
    private http:Client supabaseClient;
    private string supabaseServiceRoleKey;

    # Initialize voting activity service
    #
    # + supabaseClient - Database client instance
    # + supabaseServiceRoleKey - Supabase service role key
    public function init(http:Client supabaseClient, string supabaseServiceRoleKey) {
        self.supabaseClient = supabaseClient;
        self.supabaseServiceRoleKey = supabaseServiceRoleKey;
        log:printInfo("✅ Voting activity service initialized");
    }

    # Get headers for HTTP requests
    #
    # + return - Headers map
    public function getHeaders() returns map<string> {
        return {
            "apikey": self.supabaseServiceRoleKey,
            "Authorization": "Bearer " + self.supabaseServiceRoleKey,
            "Content-Type": "application/json"
        };
    }

    # Get voting activity by hour for today
    #
    # + return - Hourly voting activity data or error
    public function getVotingActivity() returns json|error {
        do {
            map<string> headers = self.getHeaders();
            
            log:printInfo("Getting voting activity from proposal_votes table");
            
            // Get all votes from proposal_votes table
            string endpoint = "/rest/v1/proposal_votes?select=updated_at";
            http:Response response = check self.supabaseClient->get(endpoint, headers);
            
            json[] activityData = [];
            
            // Initialize all 24 hours with 0 votes
            foreach int hour in 0...23 {
                string hourStr = hour < 10 ? "0" + hour.toString() + ":00" : hour.toString() + ":00";
                activityData.push({
                    "hour": hourStr,
                    "votes": 0
                });
            }
            
            if response.statusCode == 200 {
                json result = check response.getJsonPayload();
                json[] votes = check result.ensureType();
                
                log:printInfo("Found " + votes.length().toString() + " votes in database");
                
                // Process votes to count by hour for today
                int todayVotes = 0;
                map<int> hourCounts = {};
                
                // Get today's date
                [int, decimal] currentTimeData = time:utcNow();
                time:Utc currentTime = [currentTimeData[0], currentTimeData[1]];
                time:Civil currentCivil = time:utcToCivil(currentTime);
                string todayDate = currentCivil.year.toString() + "-" + 
                                 (currentCivil.month < 10 ? "0" + currentCivil.month.toString() : currentCivil.month.toString()) + "-" +
                                 (currentCivil.day < 10 ? "0" + currentCivil.day.toString() : currentCivil.day.toString());
                
                foreach json vote in votes {
                    map<json> voteMap = check vote.ensureType();
                    string? updatedAt = voteMap["updated_at"] is string ? check voteMap["updated_at"].ensureType(string) : ();
                    
                    if updatedAt is string && updatedAt.includes(todayDate) {
                        todayVotes += 1;
                        
                        // Extract hour from timestamp (simple approach)
                        if updatedAt.length() >= 13 && updatedAt.includes("T") {
                            int? tIndex = updatedAt.indexOf("T");
                            if tIndex is int && tIndex >= 0 && updatedAt.length() > tIndex + 2 {
                                string timePart = updatedAt.substring(tIndex + 1);
                                if timePart.length() >= 2 {
                                    string hourStr = timePart.substring(0, 2);
                                    int|error hour = int:fromString(hourStr);
                                    if hour is int && hour >= 0 && hour <= 23 {
                                        if hourCounts.hasKey(hour.toString()) {
                                            hourCounts[hour.toString()] = hourCounts.get(hour.toString()) + 1;
                                        } else {
                                            hourCounts[hour.toString()] = 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Update the activity data with actual counts
                activityData = [];
                foreach int hour in 0...23 {
                    string hourStr = hour < 10 ? "0" + hour.toString() + ":00" : hour.toString() + ":00";
                    int voteCount = hourCounts.hasKey(hour.toString()) ? hourCounts.get(hour.toString()) : 0;
                    activityData.push({
                        "hour": hourStr,
                        "votes": voteCount
                    });
                }
                
                log:printInfo("Found " + todayVotes.toString() + " votes for today");
            } else {
                log:printWarn("Failed to get votes from database: " + response.statusCode.toString());
            }
            
            return {
                "success": true,
                "message": "Voting activity retrieved from proposal_votes.updated_at column",
                "data": activityData,
                "timestamp": time:utcNow()[0]
            };
            
        } on fail error e {
            log:printError("Failed to get voting activity: " + e.message());
            
            // Return empty structure on error
            json[] emptyData = [];
            foreach int hour in 0...23 {
                string hourStr = hour < 10 ? "0" + hour.toString() + ":00" : hour.toString() + ":00";
                emptyData.push({
                    "hour": hourStr,
                    "votes": 0
                });
            }
            
            return {
                "success": false,
                "message": "Failed to get voting activity: " + e.message(),
                "data": emptyData,
                "timestamp": time:utcNow()[0]
            };
        }
    }
}
