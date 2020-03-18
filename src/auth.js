// Common code for both employers and childminders

const { baseUrl, request } = require('./request')
const { log } = require('cozy-konnector-libs')

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
  await request(formUrl)
  const $ = await request.post(loginUrl, {
    form: {
      j_username: login,
      j_password: password,
      j_passwordfake: password
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
