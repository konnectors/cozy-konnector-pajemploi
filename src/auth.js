// Common code for both employers and childminders

const { baseUrl } = require('./request')
const { log, solveCaptcha } = require('cozy-konnector-libs')

const formUrl = baseUrl + 'info/cms/sites/pajewebinfo/accueil.html'
const loginUrl = baseUrl + '/j_spring_security_check'
const logoutUrl = baseUrl + '/j_spring_security_logout'

module.exports = {
  authenticate
}

async function authenticate(login, password) {
  await this.deactivateAutoSuccessfulLogin()
  log('info', 'Authenticating...')

  // getting cookies from the form url
  await this.request(formUrl)
  const websiteURL = 'https://www.pajemploi.urssaf.fr/pajeweb/logindec.htm'
  const login$ = await this.request(websiteURL)
  const message = login$('.message').text()
  if (message.includes('maintenance')) {
    log('error', message.trim())
    throw new Error('VENDOR_DOWN')
  }
  const websiteKey = login$('.g-recaptcha').attr('data-sitekey')
  const gRecaptchaResponse = await solveCaptcha({ websiteURL, websiteKey })
  const $ = await this.request.post(loginUrl, {
    form: {
      j_username: login,
      j_password: password,
      'g-recaptcha-response': gRecaptchaResponse
    }
  })

  if (pageContainsLoginForm($)) {
    log('error', 'Login form still visible: login failed.')
    throw new Error('LOGIN_FAILED')
  } else if (pageContainsLogoutLink($)) {
    log('info', 'Logout link found: login successful.')
  } else {
    log('warn', 'Cannot find login form or logout link: where am I?')
  }
  await this.notifySuccessfulLogin()
}

function pageContainsLoginForm($) {
  return $('input#j_username').length > 0
}
function pageContainsLogoutLink($) {
  return $(`a[href="${logoutUrl}"]`)
}
