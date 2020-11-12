process.env.SENTRY_DSN =
  process.env.SENTRY_DSN ||
  'https://0c0cb928ab40494085526d2af96fff5d:50c5609fbcea4bc5abeaa49c2eac8f3a@sentry.cozycloud.cc/30'

const { CookieKonnector, log } = require('cozy-konnector-libs')

const { authenticate } = require('./auth')
const childminder = require('./childminder')
const employer = require('./employer')
const period = require('./period')

class PajemploiConnector extends CookieKonnector {
  async testSession() {
    log('debug', 'Testing current session')
    const fullResponse = await this.request(
      'https://www.pajemploi.urssaf.fr/pajeweb/connect.htm',
      { resolveWithFullResponse: true }
    )
    if (fullResponse.request.uri.href.includes('/pajeweb/connect.htm')) {
      log('debug', 'Session OK')
      return true
    } else {
      log('debug', 'Bad session')
      return false
    }
  }
  async fetch(fields) {
    const today = new Date()
    const periodRange = period.range(today)
    if (!(await this.testSession())) {
      await authenticate.bind(this)(fields.login, fields.password)
      await this.saveSession()
    }
    await employer.fetchPayslips.bind(this)({
      periodRange,
      folderPath: fields.folderPath
    })
    await employer.fetchAttests.bind(this)(fields)
    await childminder.fetchPayslips.bind(this)({
      periodRange,
      folderPath: fields.folderPath
    })
    await this.saveSession()
  }
}

const connector = new PajemploiConnector({
  cheerio: true,
  // debug: true,
  json: false
})

connector.run()
