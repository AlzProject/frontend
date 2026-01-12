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

echo "Reading $DATA_FILE..."

# Create the Image Description Test
TEST_PAYLOAD=$(jq -n '{
  title: "Image Description Test",
  description: "Describe a randomly shown image verbally for 1 minute",
  isActive: true,
  duration: 120,
  allowNegativeMarking: false,
  allowPartialMarking: false,
  shuffleQuestions: false,
  shuffleOptions: false,
  test_specific_info: {
    slug: "image-description",
    translations: {
      mr: {
        title: "चित्र वर्णन चाचणी",
        description: "यादृच्छिकपणे दाखवलेल्या चित्राचे १ मिनिट मौखिक वर्णन करा"
      }
    }
  }
}')

echo "Creating Image Description Test..."

TEST_RESPONSE=$(curl -s -X POST "$API_URL/tests" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$TEST_PAYLOAD")

TEST_ID=$(echo "$TEST_RESPONSE" | jq -r '.id')

if [ "$TEST_ID" == "null" ] || [ -z "$TEST_ID" ]; then
    echo "Failed to create test"
    echo "Response: $TEST_RESPONSE"
    exit 1
fi

echo "Test created with ID: $TEST_ID"

# Create Section
echo "Creating section..."

SEC_PAYLOAD=$(jq -n '{
  title: "Image Description",
  description: "Look at the image and describe what you see in detail for 1 minute",
  orderIndex: 1
}')

SEC_RESPONSE=$(curl -s -X POST "$API_URL/tests/$TEST_ID/sections" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$SEC_PAYLOAD")

SEC_ID=$(echo "$SEC_RESPONSE" | jq -r '.id')

if [ "$SEC_ID" == "null" ] || [ -z "$SEC_ID" ]; then
    echo "Failed to create section"
    echo "Response: $SEC_RESPONSE"
    exit 1
fi

echo "Section created with ID: $SEC_ID"

# Create Question
echo "Creating question..."

Q_PAYLOAD=$(jq -n '{
  text: "Please look at the image shown below and describe it in as much detail as possible. You have 1 minute to speak.",
  type: "file_upload",
  maxScore: 1,
  negativeScore: 0,
  partialMarking: false,
  config: {
    recordingDuration: 60,
    imagePool: ["image1.jpg", "image2.jpg", "image3.jpg", "image4.jpg", "image5.jpg"],
    randomImage: true,
    instructions: "Click '\''Start Recording'\'' and describe everything you see in the image. Speak clearly and continuously for up to 1 minute."
  }
}')

Q_RESPONSE=$(curl -s -X POST "$API_URL/sections/$SEC_ID/questions" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$Q_PAYLOAD")

Q_ID=$(echo "$Q_RESPONSE" | jq -r '.id')

if [ "$Q_ID" == "null" ] || [ -z "$Q_ID" ]; then
    echo "Failed to create question"
    echo "Response: $Q_RESPONSE"
    exit 1
fi

echo "Question created with ID: $Q_ID"

# Upload images if they exist
echo ""
echo "Checking for images to upload..."

for i in {1..5}; do
    IMAGE_FILE="Images/image$i.jpg"
    
    if [ -f "$SCRIPT_DIR/$IMAGE_FILE" ]; then
        echo "Found $IMAGE_FILE, uploading..."
        
        # Get presigned URL
        PRESIGNED_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            "$API_URL/media" \
            -H "$AUTH_HEADER" \
            -H "Content-Type: application/json" \
            -d '{"type":"image","label":"image-description-'$i'"}')
        
        HTTP_STATUS=$(echo "$PRESIGNED_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
        PRESIGNED_BODY=$(echo "$PRESIGNED_RESPONSE" | sed '/HTTP_STATUS:/d')
        
        if [ "$HTTP_STATUS" != "200" ] && [ "$HTTP_STATUS" != "201" ]; then
            echo "  Failed to get presigned URL (HTTP $HTTP_STATUS)"
            continue
        fi
        
        PRESIGNED_URL=$(echo "$PRESIGNED_BODY" | jq -r '.presignedUrl // empty')
        MEDIA_ID=$(echo "$PRESIGNED_BODY" | jq -r '.id // empty')
        
        if [ -z "$PRESIGNED_URL" ] || [ "$PRESIGNED_URL" == "null" ]; then
            echo "  No presigned URL in response"
            continue
        fi
        
        # Upload to S3
        S3_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X PUT \
            -H "Content-Type: image/jpeg" \
            --data-binary "@${SCRIPT_DIR}/${IMAGE_FILE}" \
            "$PRESIGNED_URL")
        
        S3_STATUS=$(echo "$S3_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
        
        if [ "$S3_STATUS" != "200" ]; then
            echo "  S3 upload failed (HTTP $S3_STATUS)"
            continue
        fi
        
        echo "  ✓ Uploaded $IMAGE_FILE (Media ID: $MEDIA_ID)"
        
        # Attach to question
        ATTACH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X POST "$API_URL/questions/$Q_ID/media/$MEDIA_ID" \
            -H "$AUTH_HEADER")
        
        ATTACH_STATUS=$(echo "$ATTACH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
        
        if [ "$ATTACH_STATUS" == "204" ]; then
            echo "  ✓ Attached to question"
        fi
    else
        echo "Image $IMAGE_FILE not found (optional)"
    fi
done

echo ""
echo "✓ Image Description Test setup complete!"
echo ""
echo "Test Details:"
echo "  Test ID: $TEST_ID"
echo "  Section ID: $SEC_ID"
echo "  Question ID: $Q_ID"
echo "  Slug: image-description"
echo "  URL: /test/image-description"
echo ""
echo "Done."
