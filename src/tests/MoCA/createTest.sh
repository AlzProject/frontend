#!/bin/bash

# -----------------------------
# CONFIG
# -----------------------------
API_BASE="http://localhost:3000/v1"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTc2NDE4MTQxNCwiZXhwIjoxNzY0MTg1MDE0fQ.mkP5dTySXclfVRrZJbSntdwMCBLrGhIOJc4qFPlxCuo"
JSON_FILE="MOCA_Questions.json"

AUTH_HEADER="Authorization: Bearer $TOKEN"

# -----------------------------
# FUNCTION HELPERS
# -----------------------------
create_test() {
    local title="$1"
    local description="$2"
    local language="$3"

    echo "➡ Creating test: $title"

    test_id=$(curl -s -X POST "$API_BASE/tests" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
          \"title\": \"$title\",
          \"description\": \"$description\",
          \"isActive\": true,
          \"test_specific_info\": {
            \"language\": \"$language\"
          }
        }" | jq -r '.id')

    echo "   ✔ Test created with id: $test_id"
    echo "$test_id"
}

create_section() {
    local test_id="$1"
    local title="$2"
    local orderIndex="$3"

    echo "   ➡ Creating section: $title"

    section_id=$(curl -s -X POST "$API_BASE/tests/$test_id/sections" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"orderIndex\": $orderIndex
        }" | jq -r '.id')

    echo "      ✔ Section created with id: $section_id"
    echo "$section_id"
}

create_question() {
    local section_id="$1"
    local text="$2"
    local type="$3"
    local maxScore="$4"
    local config_json="$5"

    echo "      ➡ Creating question: $text"

    # Use jq to inject config JSON safely
    question_payload=$(jq -n \
        --arg text "$text" \
        --arg type "$type" \
        --argjson cfg "$config_json" \
        --argjson maxScore "$maxScore" \
        '{text: $text, type: $type, maxScore: $maxScore, test_specific_info: $cfg}'
    )

    question_id=$(curl -s -X POST "$API_BASE/sections/$section_id/questions" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "$question_payload" | jq -r '.id')

    echo "         ✔ Question created with id: $question_id"
}

# -----------------------------
# MAIN SCRIPT
# -----------------------------

if ! command -v jq &> /dev/null; then
    echo "❌ ERROR: 'jq' is required. Install it first."
    exit 1
fi

echo "==============================="
echo "   Creating MOCA Tests"
echo "==============================="

tests_count=$(jq length "$JSON_FILE")

for i in $(seq 0 $((tests_count-1))); do
    test_title=$(jq -r ".[$i].title" "$JSON_FILE")
    test_description=$(jq -r ".[$i].description" "$JSON_FILE")
    test_language=$(jq -r ".[$i].language" "$JSON_FILE")

    # Create test
    test_id=$(create_test "$test_title" "$test_description" "$test_language")

    # Fetch sections
    sections_count=$(jq ".[$i].sections | length" "$JSON_FILE")

    for s in $(seq 0 $((sections_count-1))); do
        section_title=$(jq -r ".[$i].sections[$s].title" "$JSON_FILE")
        orderIndex=$(jq -r ".[$i].sections[$s].orderIndex" "$JSON_FILE")

        # Create section
        section_id=$(create_section "$test_id" "$section_title" "$orderIndex")

        # Fetch questions
        questions_count=$(jq ".[$i].sections[$s].questions | length" "$JSON_FILE")

        for q in $(seq 0 $((questions_count-1))); do
            q_text=$(jq -r ".[$i].sections[$s].questions[$q].text" "$JSON_FILE")
            q_type=$(jq -r ".[$i].sections[$s].questions[$q].type" "$JSON_FILE")
            q_maxScore=$(jq -r ".[$i].sections[$s].questions[$q].maxScore" "$JSON_FILE")
            q_config=$(jq ".[$i].sections[$s].questions[$q].config" "$JSON_FILE")

            create_question "$section_id" "$q_text" "$q_type" "$q_maxScore" "$q_config"
        done
    done

    echo "✔ Completed creating test: $test_title"
    echo "---------------------------------------"
done

echo "🎉 All MOCA tests created successfully!"
