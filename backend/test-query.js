const db = require('./db')

async function test() {
  try {
    const sql = `SELECT d.*, r.name, r.id_card, r.gender, 
                 TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) as age, 
                 h.address 
                 FROM disabled_persons d 
                 LEFT JOIN residents r ON d.resident_id = r.id 
                 LEFT JOIN households h ON r.household_id = h.household_number 
                 LIMIT 1`

    const [rows] = await db.pool.execute(sql)
    console.log('Raw row keys:', Object.keys(rows[0]))
    console.log('Raw row:', JSON.stringify(rows[0], null, 2))
  } catch (err) {
    console.error('Error:', err.message)
  }
  process.exit(0)
}

test()
