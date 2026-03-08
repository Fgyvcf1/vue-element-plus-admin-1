const axios = require('axios')

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001/api'
  const url = `${baseUrl}/disabled-persons`

  try {
    const response = await axios.get(url, {
      params: {
        pageNum: 1,
        pageSize: 10
      },
      timeout: 10000
    })

    const body = response.data || {}
    const isOk =
      body.code === 20000 &&
      Array.isArray(body.data) &&
      typeof body.total === 'number' &&
      typeof body.pageNum === 'number' &&
      typeof body.pageSize === 'number'

    if (!isOk) {
      console.error('[FAIL] disabled query contract mismatch')
      console.error(JSON.stringify(body, null, 2))
      process.exit(1)
      return
    }

    console.log('[PASS] disabled query contract OK')
    console.log(
      JSON.stringify(
        {
          total: body.total,
          pageNum: body.pageNum,
          pageSize: body.pageSize,
          listSize: body.data.length
        },
        null,
        2
      )
    )
  } catch (error) {
    console.error('[FAIL] disabled query request error')
    if (error.response) {
      console.error('status:', error.response.status)
      console.error(JSON.stringify(error.response.data, null, 2))
    } else {
      console.error(error.message)
    }
    process.exit(1)
  }
}

main()
