/**
 * Seed MoCA Test (English + Marathi) into backend
 * 
 * Requirements:
 *   - moca.json file in same directory
 *   - axios installed (npm install axios)
 *   - Valid Bearer token
 */

import axios from "axios";
import fs from "fs"

const API_BASE = "http://localhost:3000/v1";   // Change if needed
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInR5cGUiOiJhZG1pbiIsImlhdCI6MTc2NDE4MTQxNCwiZXhwIjoxNzY0MTg1MDE0fQ.mkP5dTySXclfVRrZJbSntdwMCBLrGhIOJc4qFPlxCuo";                  // Replace this
const INPUT_FILE = "./MOCA_Questions.json";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json"
  }
});

async function createTest(test) {
  console.log(`➡ Creating Test: ${test.title}`);

  const payload = {
    title: test.title,
    description: test.description,
    isActive: true,
    test_specific_info: { language: test.language }
  };

  const res = await api.post("/tests", payload);
  console.log(`   ✔ Test created with ID: ${res.data.id}`);
  return res.data.id;
}

async function createSection(testId, section) {
  console.log(`   ➡ Creating Section: ${section.title}`);

  const payload = {
    title: section.title,
    orderIndex: section.orderIndex
  };

  // Only include description if present
  if (section.description) {
    payload.description = section.description;
  }

  const res = await api.post(`/tests/${testId}/sections`, payload);
  console.log(`      ✔ Section ID: ${res.data.id}`);
  return res.data.id;
}

async function createQuestion(sectionId, question) {
  console.log(`      ➡ Creating Question: ${question.text}`);
  console.log(`      📌 Posting to: /sections/${sectionId}/questions`);

  const payload = {
    text: question.text,
    type: question.type,
    maxScore: question.maxScore
  };

  // Your backend does NOT support question JSON metadata yet.
  // Cannot send question.config

  const res = await api.post(`/sections/${sectionId}/questions`, payload);
  console.log(`         ✔ Question ID: ${res.data.id}`);
  return res.data.id;
}


async function seed() {
  try {
    const tests = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

    for (const test of tests) {
      const testId = await createTest(test);

      for (const section of test.sections) {
        const sectionId = await createSection(testId, section);

        for (const question of section.questions) {
          await createQuestion(sectionId, question);
        }
      }

      console.log(`✔ Completed seeding Test: ${test.title}`);
      console.log("------------------------------------------------");
    }

    console.log("🎉 All MoCA tests seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding MoCA:", err.response?.data || err.message);
  }
}

seed();
