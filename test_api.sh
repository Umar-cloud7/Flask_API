#!/bin/bash

# API Testing Script
# Usage: ./test_api.sh [base_url]
# Example: ./test_api.sh http://localhost:5000

BASE_URL="${1:-http://localhost:5000}"
echo "Testing API at: $BASE_URL"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Generate test user
TEST_USER="testuser_$(date +%s)"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!@#"

echo -e "${BLUE}=== 1. HEALTH CHECK ===${NC}"
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" | json_pp
echo -e "\n"

echo -e "${BLUE}=== 2. REGISTER USER ===${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USER\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")
echo "$REGISTER_RESPONSE" | json_pp
echo -e "\n"

echo -e "${BLUE}=== 3. LOGIN USER ===${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USER\",
    \"password\": \"$TEST_PASSWORD\"
  }")
echo "$LOGIN_RESPONSE" | json_pp

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}Token obtained: ${TOKEN:0:20}...${NC}\n"

echo -e "${BLUE}=== 4. CREATE TASK ===${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"Deploy Flask API to AWS\",
    \"description\": \"Set up EC2, RDS, and ALB\",
    \"priority\": \"high\",
    \"due_date\": \"2025-02-01T18:00:00\"
  }")
echo "$CREATE_RESPONSE" | json_pp

# Extract task ID
TASK_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "${GREEN}Task created with ID: $TASK_ID${NC}\n"

echo -e "${BLUE}=== 5. GET ALL TASKS ===${NC}"
curl -s -X GET "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

echo -e "${BLUE}=== 6. GET SINGLE TASK ===${NC}"
curl -s -X GET "$BASE_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

echo -e "${BLUE}=== 7. UPDATE TASK ===${NC}"
curl -s -X PUT "$BASE_URL/api/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"status\": \"in_progress\",
    \"priority\": \"medium\"
  }" | json_pp
echo -e "\n"

echo -e "${BLUE}=== 8. GET STATISTICS ===${NC}"
curl -s -X GET "$BASE_URL/api/stats" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

echo -e "${BLUE}=== 9. FILTER TASKS BY STATUS ===${NC}"
curl -s -X GET "$BASE_URL/api/tasks?status=in_progress&per_page=5" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

echo -e "${BLUE}=== 10. DELETE TASK ===${NC}"
curl -s -X DELETE "$BASE_URL/api/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

echo -e "${GREEN}=== ALL TESTS COMPLETED ===${NC}"
