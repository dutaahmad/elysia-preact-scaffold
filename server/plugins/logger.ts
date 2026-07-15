import logixlysia from 'logixlysia'
import { config } from '../config'

export const loggerPlugin = logixlysia({
  config: {
    preset: config.isProduction ? 'prod' : 'dev',
    ip: true,
    showStartupMessage: true,
    timestamp: {
      translateTime: 'yyyy-mm-dd HH:MM:ss.SSS',
    },
  },
})
