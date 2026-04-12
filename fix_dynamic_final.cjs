const fs = require('fs');
let code = fs.readFileSync('/home/parag/Projects/AlzProject/frontend/src/components/DynamicTest.jsx', 'utf8');

code = code.replace(
  "<QuestionWrapper mediaUrls={audioMediaUrls} key={`qw-${q.id}`} title={config.title} description={config.description || qText}> m.url) || []} key={`qw-${q.id}`} title={config.title} description={config.description || qText}>",
  "<QuestionWrapper mediaUrls={audioMediaUrls} key={`qw-${q.id}`} title={config.title} description={config.description || qText}>"
);

fs.writeFileSync('/home/parag/Projects/AlzProject/frontend/src/components/DynamicTest.jsx', code);
