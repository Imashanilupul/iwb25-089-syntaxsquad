import ballerina/test;

@test:Config {}
function testBasic() {
    test:assertTrue(true, "Basic test should pass");
}

@test:Config {}
function testString() {
    string testString = "Hello World";
    test:assertEquals(testString, "Hello World", "String should match");
}

@test:Config {}
function testMath() {
    int result = 2 + 2;
    test:assertEquals(result, 4, "2 + 2 should equal 4");
}
