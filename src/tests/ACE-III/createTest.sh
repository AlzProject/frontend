#!/bin/bash

# Configuration
API_URL="${API_URL:-http://localhost:3000/v1}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DATA_FILE="$SCRIPT_DIR/data.json"

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

# Helper function to get mime type
get_mime_type() {
    local filename="$1"
    case "$filename" in
        *.jpg|*.jpeg) echo "image/jpeg" ;;
        *.png) echo "image/png" ;;
        *.svg) echo "image/svg+xml" ;;
        *.webp) echo "image/webp" ;;
        *.avif) echo "image/avif" ;;
        *) echo "application/octet-stream" ;;
    esac
}

# Helper function to upload file using S3 Presigned URL Flow
upload_file_s3() {
    local FILE_PATH="$1"
    local QUESTION_ID="$2"
    local LABEL="$3"
    
    local FILENAME=$(basename "$FILE_PATH")
    local MIME_TYPE=$(get_mime_type "$FILENAME")
    
    echo "        Processing: $FILENAME ($MIME_TYPE)"
    
    # Step 1: Get presigned URL
    local PRESIGNED_RES=$(curl -s -X POST "$API_URL/media" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "$(jq -n --arg mediatype "image" --arg medialabel "$LABEL" '{type: $mediatype, label: $medialabel}')")
    
    local PRESIGNED_URL=$(echo "$PRESIGNED_RES" | jq -r '.presignedUrl')
    local MEDIA_ID=$(echo "$PRESIGNED_RES" | jq -r '.id')
    
    if [ "$PRESIGNED_URL" == "null" ] || [ -z "$PRESIGNED_URL" ]; then
        echo "        ❌ Failed to get presigned URL"
        echo "        Response: $PRESIGNED_RES"
        return 1
    fi
    
    # Step 2: Upload to S3
    local HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X PUT \
        -H "Content-Type: $MIME_TYPE" \
        --data-binary "@$FILE_PATH" \
        "$PRESIGNED_URL")
        
    if [ "$HTTP_CODE" != "200" ]; then
        echo "        ❌ Failed to upload to S3 (HTTP $HTTP_CODE)"
        return 1
    fi
    
    # Step 3: Attach to Question
    local ATTACH_RES=$(curl -s -X POST "$API_URL/questions/$QUESTION_ID/media/$MEDIA_ID" \
        -H "$AUTH_HEADER")
        
    if echo "$ATTACH_RES" | grep -q "error"; then
        echo "        ❌ Failed to attach media"
        echo "        Response: $ATTACH_RES"
        return 1
    fi
    
    echo "        ✅ Uploaded and attached: $FILENAME"
    return 0
}

# Process Data
echo "Reading $DATA_FILE..."

# Iterate over tests
jq -c '.[]' "$DATA_FILE" | while read -r test_item; do
    TITLE=$(echo "$test_item" | jq -r '.title')
    DESCRIPTION=$(echo "$test_item" | jq -r '.description')
    LANGUAGE=$(echo "$test_item" | jq -r '.language')
    TEST_SPECIFIC_INFO=$(echo "$test_item" | jq -c '.test_specific_info // {language: .language}')
    
    echo "Creating Test: $TITLE ($LANGUAGE)"
    
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
            
            if [ "$Q_MAX_SCORE" == "0" ] || [ "$Q_MAX_SCORE" == "null" ] || [ -z "$Q_MAX_SCORE" ]; then
                Q_MAX_SCORE=1
                echo "    ⚠ Warning: maxScore was 0 or invalid, using default value 1"
            fi
            
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
            else
                echo "      Question created with ID: $Q_ID"
                
                # ----------------------------------------------
                # HANDLE MEDIA UPLOADS (imageFiles in config)
                # ----------------------------------------------
                IMAGE_FILES=$(echo "$question_item" | jq -r '.config.imageFiles[]? // empty' 2>/dev/null)
                
                if [ -n "$IMAGE_FILES" ]; then
                    echo "      Found imageFiles to upload..."
                    
                    IMAGE_FILES_ARRAY=$(echo "$question_item" | jq -c '.config.imageFiles // []')
                    IMAGE_COUNT=$(echo "$IMAGE_FILES_ARRAY" | jq 'length')
                    
                    for ((img_idx=0; img_idx<$IMAGE_COUNT; img_idx++)); do
                        IMAGE_FILE=$(echo "$IMAGE_FILES_ARRAY" | jq -r ".[$img_idx]")
                        IMAGE_PATH="$SCRIPT_DIR/Images/$IMAGE_FILE"
                        
                        if [ -f "$IMAGE_PATH" ]; then
                            upload_file_s3 "$IMAGE_PATH" "$Q_ID" "Image ${img_idx} for Q${Q_ID}"
                        else
                            echo "        ⚠ Error: Image file not found: $IMAGE_PATH"
                        fi
                    done
                fi
                
                # ----------------------------------------------
                # HANDLE MEDIA UPLOADS (referenceImageFile in config)
                # ----------------------------------------------
                REF_IMAGE=$(echo "$question_item" | jq -r '.config.referenceImageFile // empty' 2>/dev/null)
                if [ -n "$REF_IMAGE" ] && [ "$REF_IMAGE" != "null" ]; then
                    echo "      Found referenceImageFile to upload..."
                    IMAGE_PATH="$SCRIPT_DIR/Images/$REF_IMAGE"
                    
                    if [ -f "$IMAGE_PATH" ]; then
                        upload_file_s3 "$IMAGE_PATH" "$Q_ID" "Reference Image for Q${Q_ID}"
                    else
                         echo "        ⚠ Error: Reference image file not found: $IMAGE_PATH"
                    fi
                fi
                
                # ----------------------------------------------
                # HANDLE OPTIONS (for MCQ questions)
                # ----------------------------------------------
                OPTIONS=$(echo "$question_item" | jq -c '.config.options // []')
                OPTIONS_COUNT=$(echo "$OPTIONS" | jq 'length')
                
                if [ "$OPTIONS_COUNT" -gt 0 ]; then
                    echo "      Creating $OPTIONS_COUNT options..."
                    
                    for ((opt_idx=0; opt_idx<$OPTIONS_COUNT; opt_idx++)); do
                        OPTION=$(echo "$OPTIONS" | jq -c ".[$opt_idx]")
                        OPT_TEXT=$(echo "$OPTION" | jq -r '.text // empty')
                        OPT_IS_CORRECT=$(echo "$OPTION" | jq -r '.isCorrect // false')
                        OPT_IMAGE=$(echo "$OPTION" | jq -r '.imageFile // empty')
                        
                        # Upload option image FIRST if specified, then include mediaId in config
                        OPT_MEDIA_ID=""
                        if [ -n "$OPT_IMAGE" ] && [ "$OPT_IMAGE" != "null" ]; then
                            IMAGE_PATH="$SCRIPT_DIR/Images/$OPT_IMAGE"
                            
                            if [ -f "$IMAGE_PATH" ]; then
                                echo "        Pre-uploading option image: $OPT_IMAGE"
                                
                                OPT_FILENAME=$(basename "$IMAGE_PATH")
                                OPT_MIME_TYPE=$(get_mime_type "$OPT_FILENAME")
                                
                                # Get presigned URL
                                OPT_PRESIGNED_RES=$(curl -s -X POST "$API_URL/media" \
                                    -H "$AUTH_HEADER" \
                                    -H "Content-Type: application/json" \
                                    -d "$(jq -n --arg mediatype "image" --arg medialabel "Option ${opt_idx} Image for Q${Q_ID}" '{type: $mediatype, label: $medialabel}')")
                                
                                OPT_PRESIGNED_URL=$(echo "$OPT_PRESIGNED_RES" | jq -r '.presignedUrl')
                                OPT_MEDIA_ID=$(echo "$OPT_PRESIGNED_RES" | jq -r '.id')
                                
                                if [ "$OPT_PRESIGNED_URL" != "null" ] && [ -n "$OPT_PRESIGNED_URL" ]; then
                                    # Upload to S3
                                    OPT_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
                                        -X PUT \
                                        -H "Content-Type: $OPT_MIME_TYPE" \
                                        --data-binary "@$IMAGE_PATH" \
                                        "$OPT_PRESIGNED_URL")
                                    
                                    if [ "$OPT_HTTP_CODE" == "200" ]; then
                                        echo "          ✅ Uploaded option image (mediaId: $OPT_MEDIA_ID)"
                                    else
                                        echo "          ❌ Failed to upload option image (HTTP $OPT_HTTP_CODE)"
                                        OPT_MEDIA_ID=""
                                    fi
                                else
                                    echo "          ❌ Failed to get presigned URL for option image"
                                    OPT_MEDIA_ID=""
                                fi
                            else
                                echo "          ⚠ Option image not found: $IMAGE_PATH"
                            fi
                        fi
                        
                        # Build config object with imageFile AND mediaId (if uploaded)
                        if [ -n "$OPT_MEDIA_ID" ]; then
                            OPT_CONFIG=$(echo "$OPTION" | jq -c --argjson mediaId "$OPT_MEDIA_ID" '. + {mediaId: $mediaId} | {imageFile, mediaId}')
                        else
                            OPT_CONFIG=$(echo "$OPTION" | jq -c '. | {imageFile}')
                        fi
                        
                        OPT_PAYLOAD=$(jq -n \
                            --arg text "$OPT_TEXT" \
                            --argjson isCorrect "$OPT_IS_CORRECT" \
                            --argjson config "$OPT_CONFIG" \
                            '{text: $text, isCorrect: $isCorrect, config: $config}')
                        
                        OPT_RESPONSE=$(curl -s -X POST "$API_URL/questions/$Q_ID/options" \
                            -H "Content-Type: application/json" \
                            -H "$AUTH_HEADER" \
                            -d "$OPT_PAYLOAD")
                        
                        OPT_ID=$(echo "$OPT_RESPONSE" | jq -r '.id')
                        
                        if [ "$OPT_ID" == "null" ]; then
                            echo "        ❌ Failed to create option $opt_idx"
                        else
                            echo "        ✅ Option $opt_idx created (ID: $OPT_ID)"
                            
                            # Attach media to option if we uploaded it
                            if [ -n "$OPT_MEDIA_ID" ]; then
                                curl -s -X POST "$API_URL/options/$OPT_ID/media/$OPT_MEDIA_ID" \
                                    -H "$AUTH_HEADER" > /dev/null
                                echo "          ✅ Attached media to option"
                            fi
                        fi
                    done
                fi
            fi
        done
    done
done

echo "Done."
