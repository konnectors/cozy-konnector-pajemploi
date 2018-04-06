const { cozyClient, log, requestFactory } = require('cozy-konnector-libs')

const request = requestFactory({
  cheerio: true,
  // debug: true,
  jar: true,
  json: false
})

const baseUrl = 'http://www.pajemploi.urssaf.fr/pajeweb'
const loginUrl = baseUrl + '/j_spring_security_check'
const logoutUrl = baseUrl + '/j_spring_security_logout'
const downloadUrl = baseUrl + '/paje_bulletinsalaire.pdf'

// For some reason, first date is formatted like "2018-01-01 00:00:00.0", while
// subsequent ones look like "01/2018".
const frDateRegExp = /\s*(\d{2})\/(\d{4}).*/
const isoDateRegExp = /\s*(\d{4})-(\d{2}).*/

module.exports = {
  authenticate,
  baseUrl,
  downloadUrl,
  mkdirp,
  parsePeriod,
  request,
  searchPeriodBefore
}

function searchPeriodBefore(today) {
  return {
    startYear: '2004', // Pajemploi exists since 2004
    startMonth: '01',
    endYear: today.getFullYear().toString(),
    endMonth: `0${today.getMonth() + 1}`.slice(-2)
  }
}

function authenticate(login, password) {
  log('info', 'Authenticating...')
  return request({
    method: 'POST',
    uri: loginUrl,
    form: {
      j_username: login,
      j_password: password,
      j_passwordfake: password
    }
  }).then($ => {
    if (pageContainsLoginForm($)) {
      log('error', 'Login form still visible: login failed.')
      throw new Error('LOGIN_FAILED')
    } else if (pageContainsLogoutLink($)) {
      log('info', 'Logout link found: login successful.')
    } else {
      log('warn', 'Cannot find login form or logout link: where am I?')
    }
  })
}

function pageContainsLoginForm($) {
  return $('input#j_username').length > 0
}

function pageContainsLogoutLink($) {
  return $(`a[href="${logoutUrl}"]`)
}

function parsePeriod(dateString) {
  const frDateMatch = frDateRegExp.exec(dateString)
  const [year, month] = frDateMatch
    ? frDateMatch.slice(1, 3).reverse()
    : isoDateRegExp.exec(dateString).slice(1, 3)
  return `${year}-${month}`
}

// create a folder if it does not already exist
function mkdirp(path, folderName) {
  return cozyClient.files.statByPath(`${path}/${folderName}`).catch(err => {
    log('info', err.message, `${path} folder does not exist yet, creating it`)
    return cozyClient.files.statByPath(`${path}`).then(parentFolder =>
      cozyClient.files.createDirectory({
        name: folderName,
        dirID: parentFolder._id
      })
    )
  })
}
