// Force sentry DSN into environment variables
// In the future, will be set by the stack
process.env.SENTRY_DSN =
  process.env.SENTRY_DSN ||
  'https://0c0cb928ab40494085526d2af96fff5d:50c5609fbcea4bc5abeaa49c2eac8f3a@sentry.cozycloud.cc/30'

const { BaseKonnector } = require('cozy-konnector-libs')
const { authenticate, searchPeriodBefore } = require('./common')
const childminder = require('./childminder')
const employer = require('./employer')

module.exports = new BaseKonnector(function fetch(fields) {
  const today = new Date()
  const period = searchPeriodBefore(today)

  return authenticate(fields.login, fields.password)
    .then(() => employer.fetchPayslips(period, fields.folderPath))
    .then(() => childminder.fetchPayslips(period, fields.folderPath))
})
