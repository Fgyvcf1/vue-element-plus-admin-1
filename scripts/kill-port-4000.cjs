const { execSync } = require('child_process')

const port = 4000

function killPort(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr LISTENING | findstr :${targetPort}`, {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString()

    const pids = new Set()
    output
      .trim()
      .split('\n')
      .forEach((line) => {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 5) {
          const pid = parts[4]
          if (pid) pids.add(pid)
        }
      })

    if (pids.size === 0) {
      return
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
      } catch (err) {
        // ignore individual kill failures
      }
    }
  } catch (err) {
    // port not in use
  }
}

killPort(port)
