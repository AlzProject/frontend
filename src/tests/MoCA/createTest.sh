#!/bin/bash

# Configuration
API_URL="${API_URL:-https://alz.adityaap.tech/v1}"
DATA_FILE="data.json"

# Check requirements
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed."
    exit 1
fi

if [ ! -f "$DATA_FILE" ]; then
    echo "Error: $DATA_FILE not found."
    exit 1
fi

# Authentication
if [ -z "$ACCESS_TOKEN" ]; then
    echo "Authenticating..."
    if [ -z "$ADMIN_EMAIL" ]; then
        read -p "Admin Email: " ADMIN_EMAIL
    fi
    if [ -z "$ADMIN_PASSWORD" ]; then
        read -s -p "Admin Password: " ADMIN_PASSWORD
        echo
    fi

    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$(jq -n --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" '{email: $email, password: $password}')")
    
    ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')
    
    if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
        echo "Authentication failed."
        echo "Response: $RESPONSE"
        exit 1
    fi
    echo "Authentication successful."
fi

AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"

# Determine script directory
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
echo "Using SCRIPT_DIR = $SCRIPT_DIR"

# Process Data
echo "Reading $DATA_FILE..."

# Iterate over tests
jq -c '.[]' "$DATA_FILE" | while read -r test_item; do
    TITLE=$(echo "$test_item" | jq -r '.title')
    DESCRIPTION=$(echo "$test_item" | jq -r '.description')
    LANGUAGE=$(echo "$test_item" | jq -r '.language')
    TEST_SPECIFIC_INFO=$(echo "$test_item" | jq -c '.test_specific_info // {language: .language}')
    
    echo "Creating Test: $TITLE ($LANGUAGE)"
    
    # Create Test Payload
    TEST_PAYLOAD=$(jq -n \
        --arg title "$TITLE" \
        --arg desc "$DESCRIPTION" \
        --argjson tsi "$TEST_SPECIFIC_INFO" \
        '{title: $title, description: $desc, test_specific_info: $tsi, isActive: true}')
        
    TEST_RESPONSE=$(curl -s -X POST "$API_URL/tests" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d "$TEST_PAYLOAD")
        
    TEST_ID=$(echo "$TEST_RESPONSE" | jq -r '.id')
    
    if [ "$TEST_ID" == "null" ]; then
        echo "Failed to create test: $TITLE"
        echo "$TEST_RESPONSE"
        continue
    fi
    
    echo "  Test created with ID: $TEST_ID"
    
    # Iterate over sections
    echo "$test_item" | jq -c '.sections[]' | while read -r section_item; do
        SEC_TITLE=$(echo "$section_item" | jq -r '.title')
        ORDER_INDEX=$(echo "$section_item" | jq -r '.orderIndex')
        
        echo "  Creating Section: $SEC_TITLE"
        
        SEC_PAYLOAD=$(jq -n \
            --arg title "$SEC_TITLE" \
            --argjson order "$ORDER_INDEX" \
            '{title: $title, orderIndex: $order, description: ""}')
            
        SEC_RESPONSE=$(curl -s -X POST "$API_URL/tests/$TEST_ID/sections" \
            -H "Content-Type: application/json" \
            -H "$AUTH_HEADER" \
            -d "$SEC_PAYLOAD")
            
        SEC_ID=$(echo "$SEC_RESPONSE" | jq -r '.id')
        
        if [ "$SEC_ID" == "null" ]; then
            echo "  Failed to create section: $SEC_TITLE"
            echo "  $SEC_RESPONSE"
            continue
        fi
        
        echo "    Section created with ID: $SEC_ID"
        
        # Iterate over questions
        echo "$section_item" | jq -c '.questions[]' | while read -r question_item; do
            Q_TEXT=$(echo "$question_item" | jq -r '.text')
            Q_TYPE=$(echo "$question_item" | jq -r '.type')
            Q_MAX_SCORE=$(echo "$question_item" | jq -r '.maxScore')
            Q_NEG_SCORE=$(echo "$question_item" | jq -r '.negativeScore // 0')
            Q_PARTIAL=$(echo "$question_item" | jq -r '.partialMarking // false')
            Q_CONFIG=$(echo "$question_item" | jq -c '.config')
            
            # Backend validation: maxScore must be positive (> 0)
            # If maxScore is 0 or invalid, use default value of 1
            if [ "$Q_MAX_SCORE" == "0" ] || [ "$Q_MAX_SCORE" == "null" ] || [ -z "$Q_MAX_SCORE" ]; then
                Q_MAX_SCORE=1
                echo "    ⚠ Warning: maxScore was 0 or invalid, using default value 1"
            fi
            
            # Truncate text for display
            Q_DISPLAY="${Q_TEXT:0:30}"
            if [ ${#Q_TEXT} -gt 30 ]; then Q_DISPLAY="${Q_DISPLAY}..."; fi
            
            echo "    Creating Question: $Q_DISPLAY"
            
            Q_PAYLOAD=$(jq -n \
                --arg text "$Q_TEXT" \
                --arg type "$Q_TYPE" \
                --argjson maxScore "$Q_MAX_SCORE" \
                --argjson negativeScore "$Q_NEG_SCORE" \
                --argjson partialMarking "$Q_PARTIAL" \
                --argjson config "$Q_CONFIG" \
                '{text: $text, type: $type, maxScore: $maxScore, negativeScore: $negativeScore, partialMarking: $partialMarking, config: $config}')
                
            Q_RESPONSE=$(curl -s -X POST "$API_URL/sections/$SEC_ID/questions" \
                -H "Content-Type: application/json" \
                -H "$AUTH_HEADER" \
                -d "$Q_PAYLOAD")
                
            Q_ID=$(echo "$Q_RESPONSE" | jq -r '.id')
            
            if [ "$Q_ID" == "null" ]; then
                echo "      Failed to create question."
                echo "      $Q_RESPONSE"
                continue
            fi
            
            echo "      Question created with ID: $Q_ID"
            
            # ----------------------------------------------
            # HANDLE MEDIA UPLOADS (imageFiles in config)
            # ----------------------------------------------
            # S3 Presigned URL Flow (per openapi.yaml):
            # 1. POST /media with JSON { type, label } -> Get presigned URL + media ID
            # 2. PUT file to presigned URL (direct S3 upload)
            # 3. POST /questions/{id}/media/{mediaId} to attach
            # ----------------------------------------------
            IMAGE_FILES=$(echo "$question_item" | jq -r '.config.imageFiles[]? // empty' 2>/dev/null)
            
            if [ -n "$IMAGE_FILES" ]; then
                echo "      Found image files to upload"
                
                # Read imageFiles as JSON array
                IMAGE_FILES_ARRAY=$(echo "$question_item" | jq -c '.config.imageFiles // []')
                IMAGE_COUNT=$(echo "$IMAGE_FILES_ARRAY" | jq 'length')
                
                for ((img_idx=0; img_idx<$IMAGE_COUNT; img_idx++)); do
                    IMAGE_FILE=$(echo "$IMAGE_FILES_ARRAY" | jq -r ".[$img_idx]")
                    
                    # Resolve file location (check Images/ subdirectory)
                    if [ -f "$SCRIPT_DIR/Images/$IMAGE_FILE" ]; then
                        IMAGE_PATH="$SCRIPT_DIR/Images/$IMAGE_FILE"
                    elif [ -f "$SCRIPT_DIR/$IMAGE_FILE" ]; then
                        IMAGE_PATH="$SCRIPT_DIR/$IMAGE_FILE"
                    else
                        echo "      ⚠ ERROR: Image file not found: $IMAGE_FILE"
                        echo "      Checked: $SCRIPT_DIR/Images/$IMAGE_FILE"
                        echo "      Checked: $SCRIPT_DIR/$IMAGE_FILE"
                        continue
                    fi
                    
                    # Verify the image file is readable
                    if [ ! -r "$IMAGE_PATH" ]; then
                        echo "      ⚠ ERROR: Image file exists but is not readable: $IMAGE_PATH"
                        continue
                    fi
                    
                    # Get file information
                    FILE_SIZE=$(stat -c%s "$IMAGE_PATH" 2>/dev/null || stat -f%z "$IMAGE_PATH" 2>/dev/null)
                    FILE_TYPE=$(file -b --mime-type "$IMAGE_PATH" 2>/dev/null || echo "unknown")
                    FILENAME=$(basename "$IMAGE_PATH")
                    
                    echo "      Uploading image $((img_idx+1))/$IMAGE_COUNT: $FILENAME ($FILE_SIZE bytes)"
                    
                    # Step 1: Get presigned URL from backend
                    PRESIGNED_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
                        "$API_URL/media" \
                        -H "$AUTH_HEADER" \
                        -H "Content-Type: application/json" \
                        -d "{\"type\":\"image\",\"label\":\"$FILENAME for question $Q_ID\"}")
                    
                    # Extract HTTP status and response body
                    HTTP_STATUS=$(echo "$PRESIGNED_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
                    PRESIGNED_BODY=$(echo "$PRESIGNED_RESPONSE" | sed '/HTTP_STATUS:/d')
                    
                    if [ "$HTTP_STATUS" != "200" ] && [ "$HTTP_STATUS" != "201" ]; then
                        echo "      ⚠ Failed to get presigned URL (HTTP $HTTP_STATUS)"
                        echo "      Response: $PRESIGNED_BODY"
                        continue
                    fi
                    
                    # Extract presigned URL and media ID
                    PRESIGNED_URL=$(echo "$PRESIGNED_BODY" | jq -r '.presignedUrl // empty')
                    MEDIA_ID=$(echo "$PRESIGNED_BODY" | jq -r '.id // empty')
                    
                    if [ -z "$PRESIGNED_URL" ] || [ "$PRESIGNED_URL" == "null" ]; then
                        echo "      ⚠ No presigned URL in response"
                        echo "      Response: $PRESIGNED_BODY"
                        continue
                    fi
                    
                    if [ -z "$MEDIA_ID" ] || [ "$MEDIA_ID" == "null" ]; then
                        echo "      ⚠ No media ID in response"
                        echo "      Response: $PRESIGNED_BODY"
                        continue
                    fi
                    
                    echo "      Got presigned URL, media ID: $MEDIA_ID"
                    
                    # Step 2: Upload file directly to S3 using presigned URL
                    S3_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
                        -X PUT \
                        -H "Content-Type: $FILE_TYPE" \
                        --data-binary "@${IMAGE_PATH}" \
                        "$PRESIGNED_URL")
                    
                    S3_STATUS=$(echo "$S3_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
                    
                    if [ "$S3_STATUS" != "200" ]; then
                        echo "      ⚠ S3 upload failed (HTTP $S3_STATUS)"
                        S3_BODY=$(echo "$S3_RESPONSE" | sed '/HTTP_STATUS:/d')
                        echo "      S3 Response: $S3_BODY"
                        continue
                    fi
                    
                    echo "      ✓ File uploaded to S3 successfully"
                    
                    # Step 3: Attach media to question
                    ATTACH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
                        -X POST "$API_URL/questions/$Q_ID/media/$MEDIA_ID" \
                        -H "$AUTH_HEADER")
                    
                    ATTACH_STATUS=$(echo "$ATTACH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
                    
                    if [ "$ATTACH_STATUS" != "204" ]; then
                        echo "      ⚠ Failed to attach media to question (HTTP $ATTACH_STATUS)"
                    else
                        echo "      ✓ Media $MEDIA_ID attached to question"
                    fi
                done
            fi
        done
    done
done

echo "Done."