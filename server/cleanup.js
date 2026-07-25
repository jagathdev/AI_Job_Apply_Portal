const mongoose = require('mongoose');
require('dotenv').config({ path: 'd:/AI_Job_Apply/server/.env' });

const uri = process.env.MONGODB_URI;

const resumeSchema = new mongoose.Schema({}, { strict: false });
const Resume = mongoose.model('Resume', resumeSchema, 'resumes');

async function run() {
  await mongoose.connect(uri);
  const resumes = await Resume.find({});
  let updatedCount = 0;
  for (const resume of resumes) {
    let changed = false;
    let exp = resume.get('experience');
    let proj = resume.get('projects');

    if (exp && Array.isArray(exp)) {
      exp.forEach(e => {
        if (e.description) {
          const oldDesc = e.description;
          const newDesc = e.description.replace(/(SITUATION|TASK|ACTION|RESULT):?\s*/gi, '').replace(/\s{2,}/g, ' ').trim();
          if (oldDesc !== newDesc) {
            e.description = newDesc;
            changed = true;
          }
        }
      });
    }
    
    if (proj && Array.isArray(proj)) {
      proj.forEach(p => {
        if (p.description) {
          const oldDesc = p.description;
          const newDesc = p.description.replace(/(SITUATION|TASK|ACTION|RESULT):?\s*/gi, '').replace(/\s{2,}/g, ' ').trim();
          if (oldDesc !== newDesc) {
            p.description = newDesc;
            changed = true;
          }
        }
      });
    }
    
    if (changed) {
      await Resume.updateOne({ _id: resume._id }, { 
        $set: { 
          experience: exp,
          projects: proj 
        } 
      });
      updatedCount++;
    }
  }
  console.log('Cleaned ' + updatedCount + ' resumes');
  mongoose.disconnect();
}
run();
