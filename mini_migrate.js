const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const url = process.env.NEON_DATABASE_URL;
const sql = neon(url);

async function run() {
    console.log("Starting mini-migration...");
    const cols = [
        "arrival_mode", "vitals_pa", "vitals_fc", "vitals_fr", "vitals_sat", 
        "vitals_glicemia", "vitals_temp", "vitals_bcf", "vitals_peso", "vitals_altura",
        "has_hypertension", "has_smoking", "has_diabetes", "has_drug_allergy", "drug_allergies_list",
        "previous_hospitalization", "hospitalization_reason_local", "risk_classification", 
        "pain_scale", "signs_symptoms", "clinical_history_exam", "procedures_done", 
        "probable_diagnosis", "cid_10"
    ];

    for (const col of cols) {
        try {
            const type = col === 'pain_scale' ? 'INTEGER' : 
                         (col.startsWith('has_') || col === 'previous_hospitalization') ? 'BOOLEAN DEFAULT FALSE' : 'TEXT';
            await sql.query(`ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS ${col} ${type}`);
            console.log(`Column ${col} added/verified.`);
        } catch (e) {
            console.error(`Error adding ${col}:`, e.message);
        }
    }
    console.log("Mini-migration finished.");
}

run();
