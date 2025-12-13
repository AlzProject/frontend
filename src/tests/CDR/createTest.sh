#!/bin/bash

# Script to create CDR test in the backend
# Usage: ./createTest.sh

# Configuration
API_URL="${API_URL:-https://alz.adityaap.tech/v1}"
DATA_FILE="$(dirname "$0")/data.json"

echo "================================================"
echo "CDR Test Creation Script"
echo "================================================"
echo ""

# Check requirements
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is required but not installed."
    echo "   Install with: sudo apt-get install jq (Ubuntu/Debian)"
    echo "              or: brew install jq (macOS)"
    exit 1
fi

if [ ! -f "$DATA_FILE" ]; then
    echo "❌ Error: $DATA_FILE not found."
    exit 1
fi

# Authentication
if [ -z "$ACCESS_TOKEN" ]; then
    echo "Step 1: Authenticating..."
    
    if [ -z "$ADMIN_EMAIL" ]; then
        read -p "Admin Email: " ADMIN_EMAIL
    else
        echo "Using email: $ADMIN_EMAIL"
    fi
    
    if [ -z "$ADMIN_PASSWORD" ]; then
        read -s -p "Admin Password: " ADMIN_PASSWORD
        echo
    fi

    AUTH_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$(jq -n --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" '{email: $email, password: $password}')")
    
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.access_token')
    
    if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
        echo "❌ Authentication failed."
        echo "Response: $AUTH_RESPONSE"
        exit 1
    fi
    echo "✓ Authentication successful"
else
    echo "Step 1: Using provided ACCESS_TOKEN"
fi

AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"
echo ""

# Step 2: Read and process data
echo "Step 2: Reading test data from $DATA_FILE..."

jq -c '.[]' "$DATA_FILE" | while read -r test_item; do
    TITLE=$(echo "$test_item" | jq -r '.title')
    DESCRIPTION=$(echo "$test_item" | jq -r '.description')
    LANGUAGE=$(echo "$test_item" | jq -r '.language')
    TEST_SPECIFIC_INFO=$(echo "$test_item" | jq -c '.test_specific_info // {language: .language}')
    
    echo "Creating Test: $TITLE ($LANGUAGE)"
    
    # Create Test Payload using jq
    TEST_PAYLOAD=$(jq -n \
        --arg title "$TITLE" \
        --arg desc "$DESCRIPTION" \
        --argjson tsi "$TEST_SPECIFIC_INFO" \
        '{title: $title, description: $desc, test_specific_info: $tsi, isActive: true}')
    
    # Step 3: Create the test
    echo "Step 3: Creating test in backend..."
    TEST_CREATE_RESPONSE=$(curl -s -X POST "$API_URL/tests" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d "$TEST_PAYLOAD")

    TEST_ID=$(echo "$TEST_CREATE_RESPONSE" | jq -r '.id')

    if [ "$TEST_ID" == "null" ] || [ -z "$TEST_ID" ]; then
        echo "❌ Test creation failed."
        echo "Response: $TEST_CREATE_RESPONSE"
        exit 1
    fi

    echo "✓ Test created with ID: $TEST_ID"
    echo ""

    # Step 4: Create sections and questions
    echo "Step 4: Creating sections and questions..."
    
    echo "$test_item" | jq -c '.sections[]' | while read -r section_item; do
        SEC_TITLE=$(echo "$section_item" | jq -r '.title')
        SEC_DESC=$(echo "$section_item" | jq -r '.description // ""')
        ORDER_INDEX=$(echo "$section_item" | jq -r '.orderIndex')
        
        echo ""
        echo "  Creating Section: $SEC_TITLE (Order: $ORDER_INDEX)"
        
        # Create Section Payload using jq
        SEC_PAYLOAD=$(jq -n \
            --arg title "$SEC_TITLE" \
            --arg desc "$SEC_DESC" \
            --argjson order "$ORDER_INDEX" \
            '{title: $title, description: $desc, orderIndex: $order}')
        
        SEC_RESPONSE=$(curl -s -X POST "$API_URL/tests/$TEST_ID/sections" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d "$SEC_PAYLOAD")
        
        SEC_ID=$(echo "$SEC_RESPONSE" | jq -r '.id')
        
        if [ "$SEC_ID" == "null" ] || [ -z "$SEC_ID" ]; then
            echo "  ❌ Failed to create section: $SEC_TITLE"
            echo "  Response: $SEC_RESPONSE"
            continue
        fi
        
        echo "  ✓ Section created with ID: $SEC_ID"
        
        # Create questions for this section
        echo "$section_item" | jq -c '.questions[]' | while read -r question_item; do
            Q_TEXT=$(echo "$question_item" | jq -r '.text')
            Q_TYPE=$(echo "$question_item" | jq -r '.type')
            Q_MAX_SCORE=$(echo "$question_item" | jq -r '.maxScore')
            Q_NEG_SCORE=$(echo "$question_item" | jq -r '.negativeScore // 0')
            Q_PARTIAL=$(echo "$question_item" | jq -r '.partialMarking // false')
            Q_CONFIG=$(echo "$question_item" | jq -c '.config // {}')
            
            # Backend validation: maxScore must be positive (> 0)
            # If maxScore is 0 or invalid, use default value of 1
            if [ "$Q_MAX_SCORE" == "0" ] || [ "$Q_MAX_SCORE" == "null" ] || [ -z "$Q_MAX_SCORE" ]; then
                Q_MAX_SCORE=1
                echo "    ⚠ Warning: maxScore was 0 or invalid, using default value 1"
            fi
            
            # Store config in question.ans as JSON string (for CDR frontend compatibility)
            Q_ANS_JSON=$(echo "$Q_CONFIG" | jq -c '.')
            
            # Truncate text for display
            Q_DISPLAY="${Q_TEXT:0:40}"
            if [ ${#Q_TEXT} -gt 40 ]; then Q_DISPLAY="${Q_DISPLAY}..."; fi
            
            echo "    Creating Question: $Q_DISPLAY"
            
            # Create Question Payload using jq
            # Include all fields as per OpenAPI specification
            Q_PAYLOAD=$(jq -n \
                --arg text "$Q_TEXT" \
                --arg type "$Q_TYPE" \
                --argjson maxScore "$Q_MAX_SCORE" \
                --argjson negativeScore "$Q_NEG_SCORE" \
                --argjson partialMarking "$Q_PARTIAL" \
                --arg ans "$Q_ANS_JSON" \
                '{text: $text, type: $type, maxScore: $maxScore, negativeScore: $negativeScore, partialMarking: $partialMarking, ans: $ans}')
            
            Q_RESPONSE=$(curl -s -X POST "$API_URL/sections/$SEC_ID/questions" \
                -H "Content-Type: application/json" \
                -H "$AUTH_HEADER" \
                -d "$Q_PAYLOAD")
            
            Q_ID=$(echo "$Q_RESPONSE" | jq -r '.id')
            
            if [ "$Q_ID" == "null" ] || [ -z "$Q_ID" ]; then
                echo "      ❌ Failed to create question."
                echo "      Response: $Q_RESPONSE"
            else
                echo "      ✓ Question created with ID: $Q_ID"
            fi
        done
    done
done

echo ""
echo "================================================"
echo "✅ CDR Test creation completed!"
echo "================================================"
echo ""
echo "You can now access this test from the frontend."
echo ""

