import ballerina/http;

configurable int port = 8080;

listener http:Listener helloWorldListener = new (port);

service /api on  helloWorldListener {
    resource function get health() returns string {
        return "✅ Backend is running!";
    }

    
}
