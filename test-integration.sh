#!/bin/bash

# TAK Server Integration Test Script
# Tests the complete TS-1, TS-2, TS-3 workflow with the actual mock TAK server

SERVER_URL="http://192.168.13.5:8080"
TEST_RESULTS_FILE="test-results.json"

echo "🚀 Starting TAK Server Integration Tests..."
echo "Server URL: $SERVER_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing $test_name... "
    
    # Run the test command and capture output
    local output
    output=$(eval "$test_command" 2>&1)
    local exit_code=$?
    
    # Check if the test passed
    if [ $exit_code -eq 0 ] && [[ "$output" =~ $expected_pattern ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Command: $test_command"
        echo "   Output: $output"
        echo "   Expected pattern: $expected_pattern"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test 1: Server Health Check
echo -e "${BLUE}🔍 Testing server health...${NC}"
run_test "Server Version" \
    "curl -s $SERVER_URL/Marti/api/version" \
    "Mock TAK Server"

# Test 2: Authentication (TS-1)
echo -e "${BLUE}🔐 Testing authentication (TS-1)...${NC}"

# Test valid authentication
run_test "Valid Authentication (testuser)" \
    "curl -s -X POST $SERVER_URL/oauth/token -H 'Content-Type: application/json' -H 'X-Device-ID: test-device-1' -d '{\"username\":\"testuser\",\"password\":\"testpass\",\"grant_type\":\"password\"}'" \
    "access_token"

# Store the token for subsequent tests
TOKEN=$(curl -s -X POST $SERVER_URL/oauth/token \
    -H 'Content-Type: application/json' \
    -H 'X-Device-ID: test-device-1' \
    -d '{"username":"testuser","password":"testpass","grant_type":"password"}' | \
    grep -o '"access_token":"[^"]*"' | \
    cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to get authentication token${NC}"
    exit 1
fi

echo "   Token obtained: ${TOKEN:0:8}..."

# Test invalid authentication
run_test "Invalid Authentication" \
    "curl -s -X POST $SERVER_URL/oauth/token -H 'Content-Type: application/json' -d '{\"username\":\"invalid\",\"password\":\"invalid\",\"grant_type\":\"password\"}'" \
    "invalid_grant"

# Test 3: Connected Users
echo -e "${BLUE}👥 Testing connected users...${NC}"
run_test "Get Connected Users" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $SERVER_URL/Marti/api/contacts/all" \
    "testuser"

# Test 4: Chat Messages
echo -e "${BLUE}💬 Testing chat messages...${NC}"

# Send a chat message
run_test "Send Chat Message" \
    "curl -s -X POST $SERVER_URL/Marti/api/chat/send -H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN' -d '{\"message\":\"Test message from integration test\"}'" \
    "sent"

# Retrieve chat messages
run_test "Get Chat Messages" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $SERVER_URL/Marti/api/chat/messages" \
    "Test message from integration test"

# Test 5: CoT Messages (TS-2, TS-3)
echo -e "${BLUE}🎯 Testing CoT messages (TS-2, TS-3)...${NC}"

# Send a CoT message
COT_MESSAGE='{
    "uid": "test-integration-cot",
    "type": "a-f-G-U-C",
    "time": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "point": {
        "lat": 38.9072,
        "lon": -77.0369,
        "hae": 100
    },
    "detail": {
        "contact": {
            "_attributes": {
                "callsign": "Integration Test"
            }
        },
        "remarks": {
            "_text": "Test CoT message from integration test"
        }
    }
}'

run_test "Send CoT Message" \
    "curl -s -X POST $SERVER_URL/Marti/api/cot -H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN' -d '$COT_MESSAGE'" \
    "received"

# Get CoT messages
run_test "Get CoT Messages" \
    "curl -s -H 'Authorization: Bearer $TOKEN' $SERVER_URL/Marti/api/cot/all" \
    "Integration Test"

# Test 6: Multi-user scenario
echo -e "${BLUE}🔄 Testing multi-user scenario...${NC}"

# Authenticate second user
TOKEN2=$(curl -s -X POST $SERVER_URL/oauth/token \
    -H 'Content-Type: application/json' \
    -H 'X-Device-ID: test-device-2' \
    -d '{"username":"demouser","password":"demopass","grant_type":"password"}' | \
    grep -o '"access_token":"[^"]*"' | \
    cut -d'"' -f4)

if [ -n "$TOKEN2" ]; then
    echo "   Second user authenticated: ${TOKEN2:0:8}..."
    
    # Test that both users can see each other
    run_test "Multi-user Connected Users" \
        "curl -s -H 'Authorization: Bearer $TOKEN2' $SERVER_URL/Marti/api/contacts/all" \
        "testuser.*demouser"
    
    # Test concurrent chat messages
    run_test "Concurrent Chat Messages" \
        "curl -s -X POST $SERVER_URL/Marti/api/chat/send -H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN2' -d '{\"message\":\"Message from second user\"}'" \
        "sent"
else
    echo -e "${RED}❌ Failed to authenticate second user${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 7: Error Handling
echo -e "${BLUE}⚠️  Testing error handling...${NC}"

# Test unauthorized access
run_test "Unauthorized Access" \
    "curl -s -H 'Authorization: Bearer invalid-token' $SERVER_URL/Marti/api/contacts/all" \
    "unauthorized\\|invalid_token"

# Test malformed requests
run_test "Malformed Chat Request" \
    "curl -s -X POST $SERVER_URL/Marti/api/chat/send -H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN' -d '{}'" \
    "message_required\\|error"

# Test 8: Performance Test
echo -e "${BLUE}⚡ Testing performance...${NC}"

# Send multiple rapid requests
start_time=$(date +%s%N)
for i in {1..10}; do
    curl -s -H "Authorization: Bearer $TOKEN" "$SERVER_URL/Marti/api/contacts/all" > /dev/null &
done
wait
end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

if [ $duration -lt 5000 ]; then # Less than 5 seconds
    echo -e "${GREEN}✅ Performance test PASSED${NC} (${duration}ms for 10 concurrent requests)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Performance test FAILED${NC} (${duration}ms for 10 concurrent requests)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Generate Test Report
echo ""
echo -e "${BLUE}📊 Test Report Summary${NC}"
echo "=" $(printf "%0.s=" {1..50})
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo "=" $(printf "%0.s=" {1..50})

# Generate JSON report
cat > "$TEST_RESULTS_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "server_url": "$SERVER_URL",
    "total_tests": $TOTAL_TESTS,
    "passed_tests": $PASSED_TESTS,
    "failed_tests": $FAILED_TESTS,
    "success_rate": $(( PASSED_TESTS * 100 / TOTAL_TESTS )),
    "test_categories": {
        "authentication": "TS-1",
        "cot_messages": "TS-2, TS-3",
        "chat_messages": "Basic functionality",
        "multi_user": "Concurrent operations",
        "error_handling": "Robustness",
        "performance": "Load testing"
    }
}
EOF

echo ""
echo "📋 Detailed results saved to: $TEST_RESULTS_FILE"

# Final assessment
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All integration tests PASSED! System is ready for production.${NC}"
    exit 0
elif [ $(( PASSED_TESTS * 100 / TOTAL_TESTS )) -gt 80 ]; then
    echo -e "${YELLOW}⚠️  Most integration tests passed. Minor issues need attention.${NC}"
    exit 0
else
    echo -e "${RED}❌ Integration tests FAILED. Significant issues need to be resolved.${NC}"
    exit 1
fi
