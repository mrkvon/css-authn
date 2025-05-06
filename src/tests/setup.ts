import * as css from '@solid/community-server'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const startServer = async (port: number) => {
  const start = Date.now()

  // eslint-disable-next-line no-console
  console.log('Starting CSS server')
  // Community Solid Server (CSS) set up following example in https://github.com/CommunitySolidServer/hello-world-component/blob/main/test/integration/Server.test.ts
  const cssServer = await new css.AppRunner().create({
    loaderProperties: {
      mainModulePath: css.joinFilePath(__dirname, '../../'), // ?
      typeChecking: false, // ?
      dumpErrorState: false, // disable CSS error dump
    },
    config: css.joinFilePath(__dirname, './css-config.json'), // CSS appConfig
    // CSS cli options
    // https://github.com/CommunitySolidServer/CommunitySolidServer/tree/main#-parameters
    shorthand: {
      port,
      loggingLevel: 'off',
      seedConfig: css.joinFilePath(__dirname, './css-pod-seed.json'), // set up some Solid accounts
    },
  })
  await cssServer.start()

  // eslint-disable-next-line no-console
  console.log(
    'CSS server started on port',
    port,
    'in',
    (Date.now() - start) / 1000,
    'seconds',
  )
  return cssServer
}

export const stopServer = async (cssServer: css.App) => {
  await cssServer.stop()
}

export function getRandomPort(): number {
  // Generate a random number between 1024 and 65535
  const min = 8000
  const max = 65535
  return Math.floor(Math.random() * (max - min + 1)) + min
}
