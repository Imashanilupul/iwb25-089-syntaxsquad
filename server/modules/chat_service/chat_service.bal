import ballerina/http;
import ballerina/io;

configurable string geminiApiKey = ?;
configurable string chromadbUrl = "https://api.chroma.com";
configurable string chromadbApiKey = ?;

public service class ChatService {
    *http:Service;

    final http:Client geminiClient;
    final http:Client chromadbClient;

    public function init() returns error? {
        io:println("Initializing ChatService...");
        self.geminiClient = check new ("https://generativelanguage.googleapis.com/v1beta");
        self.chromadbClient = check new (chromadbUrl);
        io:println("ChatService initialized with Gemini URL: https://generativelanguage.googleapis.com/v1beta, ChromaDB URL: ", chromadbUrl);
    }

    resource function post chat(http:Caller caller, json payload) returns error? {
        io:println("Received chat request with payload: ", payload.toString());

        // Validate payload
        if payload !is map<json> {
            io:println("Error: Payload is not a JSON object");
            return error("Payload must be a JSON object");
        }

        // Extract and validate query
        json|error queryJson = payload["query"];
        if queryJson is error || queryJson is () {
            io:println("Error: Missing or invalid 'query' field in payload: ", queryJson);
            return error("Missing or invalid 'query' field in payload");
        }
        string query = check queryJson.ensureType(string);
        io:println("Extracted query: ", query);

        // ChromaDB request
        json searchReq = {
            "query_texts": [query],
            "n_results": 2
        };
        io:println("ChromaDB request payload: ", searchReq.toString());
        http:Request chromaReq = new;
        chromaReq.setHeader("Authorization", "Bearer " + chromadbApiKey);
        chromaReq.setJsonPayload(searchReq);
        io:println("Sending ChromaDB request to: ", chromadbUrl + "/api/v1/collections/faqs/query");
        http:Response|error searchResponse = self.chromadbClient->post("/api/v1/collections/faqs/query", chromaReq);
        if searchResponse is error {
            io:println("ChromaDB request failed: ", searchResponse.toString());
            return error("ChromaDB request failed: " + searchResponse.message());
        }
        json searchRes = check searchResponse.getJsonPayload();
        io:println("ChromaDB response: ", searchRes.toString());

        // Validate ChromaDB response
        if searchRes !is map<json> {
            io:println("Error: ChromaDB response is not a JSON object: ", searchRes);
            return error("ChromaDB response must be a JSON object");
        }
        json|error documentsJson = searchRes["documents"];
        if documentsJson is error || documentsJson is json[] && documentsJson.length() == 0 {
            io:println("Error: Invalid or empty 'documents' field in ChromaDB response: ", documentsJson);
            return error("Invalid or empty 'documents' field in ChromaDB response");
        }
        json[][] documents = <json[][]>documentsJson;
        json[] results = documents.length() > 0 ? documents[0] : [];
        io:println("ChromaDB results: ", results.toString());

        // Build context from results
        string context = "";
        foreach var item in results {
            context += item.toString() + "\n";
        }
        io:println("Built context: ", context);

        // Gemini API request
        json chatReq = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": "You are a support assistant. Use the provided context to answer the query accurately.\n\nContext: " + context + "\nQuery: " + query
                        }
                    ]
                }
            ]
        };
        io:println("Gemini request payload: ", chatReq.toString());
        http:Request geminiReq = new;
        geminiReq.setHeader("Authorization", "Bearer " + geminiApiKey);
        geminiReq.setJsonPayload(chatReq);
        io:println("Sending Gemini request to: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent");
        http:Response|error chatResponse = self.geminiClient->post("/models/gemini-1.5-flash:generateContent", geminiReq);
        if chatResponse is error {
            io:println("Gemini request failed: ", chatResponse.toString());
            return error("Gemini request failed: " + chatResponse.message());
        }
        json chatRes = check chatResponse.getJsonPayload();
        io:println("Gemini response: ", chatRes.toString());

        // Validate Gemini response
        if chatRes !is map<json> {
            io:println("Error: Gemini response is not a JSON object: ", chatRes);
            return error("Gemini response must be a JSON object");
        }
        json|error candidatesJson = chatRes["candidates"];
        if candidatesJson is error || candidatesJson is json[] && candidatesJson.length() == 0 {
            io:println("Error: Invalid or empty 'candidates' field in Gemini response: ", candidatesJson);
            return error("Invalid or empty 'candidates' field in Gemini response");
        }
        json[] candidates = <json[]>candidatesJson;
        string response = "";
        if candidates.length() > 0 {
            json content = (<map<json>>candidates[0])["content"];
            json[] parts = <json[]>((<map<json>>content)["parts"]);
            if parts.length() > 0 {
                response = (<map<json>>parts[0])["text"].toString();
            }
        }
        io:println("Final response: ", response);

        check caller->respond({"response": response});
    }
}