const {Toolkit} = require('actions-toolkit')
const crypto = require('crypto')
const fs = require('fs')
const {promisify} = require('util')

const randomBytes = promisify(crypto.randomBytes)
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const randomId = async () => (await randomBytes(16)).toString('hex')

Toolkit.run(async tools => {
  const versions = tools.arguments._.map(String)
  const builds = versions.map(vsn => runBuild(tools, vsn))
  const buildResults = await Promise.all(builds)
  await Promise.all(buildResults.map(reportBuildResult.bind(null, tools)))

  let allBuildsOk = true

  for (const buildResult of buildResults) {
    if (buildResult.ok) {
      tools.log.success(`Build ${buildResult.version} succeeded.`)
    } else {
      tools.log.error(`Build ${buildResult.version} failed.`)
      allBuildsOk = false
    }
  }

  if (allBuildsOk) {
    tools.exit.success('Matrix build succeeded.')
  } else {
    tools.exit.failure('Matrix build failed.')
  }
})

/*
 * Report a build result, either logging it when there is no token, or creating
 * a check run.
 */
async function reportBuildResult(
  tools,
  {logFile, version, ok, startedAt, completedAt}
) {
  const log = (await readFile(logFile)).toString()

  if (process.env.GITHUB_TOKEN == null) {
    console.log(log)
    return
  }

  const result = await tools.github.checks.create({
    ...tools.context.repo,
    name: `actions/node-matrix-node-${version}`,
    head_sha: tools.context.sha,
    status: 'completed',
    conclusion: ok ? 'success' : 'failure',
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    output: {
      title: `\`npm test\` with Node ${version}`,
      summary: ok ? ':tada:' : ':x:',
      text: `\`\`\`
${log}
\`\`\``
    }
  })

  if (result.status != 201) {
    tools.log.debug(result)
    tools.exit.failure(`Check run creation failed with status ${result.status}`)
  }
}

/**
 * Spawn a child process that runs a custom Node.js-version-specific Dockerfile.
 */
async function runBuild(tools, version) {
  const dockerfile = `Dockerfile.${await randomId()}`
  const logFile = `/tmp/${dockerfile}.log`

  const log = await createOpenWriteStream(logFile)

  await writeFile(dockerfile, generateDockerfile(version))

  let ok = false

  const startedAt = new Date()

  try {
    const {code} = await tools.runInWorkspace(
      'docker',
      ['build', '-f', dockerfile, '.'],
      {stdio: [0, log, log]}
    )

    ok = code === 0
  } catch (err) {
    tools.log.error(err)

    ok = false
  } finally {
    tools.log.info(`Removing temp ${dockerfile}`)
    await tools.runInWorkspace('rm', dockerfile)
  }

  const completedAt = new Date()

  return {version, logFile, ok, startedAt, completedAt}
}

function generateDockerfile(version) {
  return `FROM node:${version}
WORKDIR /src
COPY . .
RUN node --version
RUN npm --version
RUN npm ci
RUN npm test
`
}

function createOpenWriteStream(path) {
  const stream = fs.createWriteStream(path)

  return new Promise(resolve => {
    stream.on('open', () => resolve(stream))
  })
}
