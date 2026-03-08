const { generateUniqueHouseholdId } = require('./householdIdGenerator')

const normalizeVillageGroup = (value) => {
  if (!value) return ''
  return String(value).replace(/\s+/g, '').trim()
}

const isVillageCode = (value) => {
  if (!value) return false
  return !/[\u4e00-\u9fa5]/.test(String(value))
}

const resolveVillageCode = async (db, villageGroupRaw) => {
  const raw = villageGroupRaw ? String(villageGroupRaw).trim() : ''
  if (!raw) return ''

  if (isVillageCode(raw)) {
    return raw.toUpperCase()
  }

  const normalized = normalizeVillageGroup(raw)
  const candidates = normalized && normalized !== raw ? [normalized, raw] : [raw]

  for (const value of candidates) {
    const [rows] = await db.pool.execute(
      "SELECT code FROM dictionaries WHERE category = '村组' AND value = ? LIMIT 1",
      [value]
    )
    const code = rows?.[0]?.code
    if (code) {
      return String(code).trim().toUpperCase()
    }
  }

  return ''
}

const generateHouseholdNumber = async ({ db, villageGroup, idCard, checkExists }) => {
  const villageCode = await resolveVillageCode(db, villageGroup)
  const normalizedGroup = normalizeVillageGroup(villageGroup)
  return generateUniqueHouseholdId(normalizedGroup, idCard, checkExists, villageCode)
}

module.exports = {
  normalizeVillageGroup,
  resolveVillageCode,
  generateHouseholdNumber
}
