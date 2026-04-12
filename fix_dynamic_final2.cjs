const fs = require('fs');
let code = fs.readFileSync('/home/parag/Projects/AlzProject/frontend/src/components/DynamicTest.jsx', 'utf8');

code = code.replace(
  "              </QuestionWrapper>\n            );\n            }\n            break;\n          case 'text_multiline':",
  "              </QuestionWrapper>\n            );\n            break;\n          case 'text_multiline':"
);

// We need to properly remove the extra bracket everywhere else we did it
code = code.replace(/<\/QuestionWrapper>[\s]*\);[\s]*\}[\s]*break;/g, "</QuestionWrapper>\n            );\n          break;");

// and we need to fix audio notes back to how it was where it didn't use an extra nested block.
code = code.replace(
  "case 'audio_notes': {\n          let audioMediaUrls = q.media?.map(m => m.url) || [];",
  "case 'audio_notes':\n          let audioMediaUrls = q.media?.map(m => m.url) || [];"
);

fs.writeFileSync('/home/parag/Projects/AlzProject/frontend/src/components/DynamicTest.jsx', code);
