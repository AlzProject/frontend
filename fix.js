const fs = require('fs');
const path = require('path');
const testsDir = '/home/parag/Projects/AlzProject/frontend/src/tests';

function fixQuestions(qList) {
    if (qList === undefined) return;
    qList.forEach(q => {
        const t = q.type;
        const ft = q.frontend_type;
        const af = q.answerFormat;
        if (t === 'file_upload' || t === 'audio' || t === 'image' || ft === 'audio_notes' || ft === 'audio' || ft === 'image' || ft === 'drawing' || ft === 'image_upload' || af === 'audio' || af === 'file_upload') {
            if (q.ans !== undefined) {
                console.log('Removed ans: ', q.ans);
                delete q.ans;
            }
            if (q.config && q.config.correctAnswer !== undefined) {
                delete q.config.correctAnswer;
            }
        }
        if (q.subQuestions) fixQuestions(q.subQuestions);
        if (q.ans && typeof q.ans === 'string' && q.ans.includes('dynamic')) {
            console.log('Removing dynamic ans');
            delete q.ans;
        }
        if (q.config && typeof q.config.correctAnswer === 'string' && q.config.correctAnswer.includes('dynamic')) {
            delete q.config.correctAnswer;
        }
    });
}
fs.readdirSync(testsDir).forEach(tMode => {
    const p = path.join(testsDir, tMode, 'data.json');
    if (fs.existsSync(p)) {
        const file = JSON.parse(fs.readFileSync(p, 'utf8'));
        const isArr = Array.isArray(file);
        const arr = isArr ? file : [file];
        arr.forEach(d => {
            if (d.sections) d.sections.forEach(s => fixQuestions(s.questions));
        });
        fs.writeFileSync(p, JSON.stringify(isArr ? arr : arr[0], null, 2));
        console.log('Fixed ' + tMode);
    }
});
