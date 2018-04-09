const { log, saveFiles } = require('cozy-konnector-libs')
const groupBy = require('lodash.groupby')
const map = require('lodash.map')

const {
  baseUrl,
  downloadUrl,
  parsePeriod,
  mkdirp,
  request
} = require('./common')

const listUrl = baseUrl + '/ajaxlistebs.jsp'

module.exports = {
  fetchPayslips
}

// eslint-disable-next-line
function fetchPayslips(period, folderPath) {
  return fetchPayslipsMetadata().then(payslipsByEmployee =>
    fetchPayslipFiles(payslipsByEmployee, folderPath)
  )
}

function fetchPayslipsMetadata() {
  const today = new Date()
  const startYear = '2004' // Pajemploi exists since 2004
  const startMonth = '01'
  const endYear = today.getFullYear().toString()
  const endMonth = `0${today.getMonth() + 1}`.slice(-2)

  log(
    'info',
    'Looking for payslips between ' +
      `${startMonth}/${startYear} and ${endMonth}/${endYear}...`
  )

  return request({
    method: 'POST',
    uri: listUrl,
    form: {
      activite: 'T',
      byAsc: 'false',
      dtDebAnnee: startYear,
      dtDebMois: startMonth,
      dtFinAnnee: endYear,
      dtFinMois: endMonth,
      noIntSala: '',
      order: 'periode',
      paye: 'false'
    }
  })
    .then(parsePayslipList)
    .then(payslips => {
      if (payslips.length > 0) {
        log('info', `Found ${payslips.length} payslips.`)
      } else {
        log('warn', 'No payslips found.')
      }
      return groupBy(payslips, 'employee')
    })
}

function parsePayslipList($) {
  log('info', 'Parsing payslip list...')
  return Array.from($('#tabVsTous tr[onclick]')).map(tr =>
    parsePayslipRow($(tr))
  )
}

// Download form is filled up and submitted from JavaScript
const jsCodeRegExp = /^document\.getElementById\('ref'\)\.value='([^']+)';document\.getElementById\('norng'\)\.value='([^']+)';document\.formBulletinSalaire\.submit\(\);$/

function parsePayslipRow($tr) {
  const period = parsePeriod($tr.find('td:nth-child(1)').text())
  const employee = $tr.find('td:nth-child(2)').text()
  const amount = $tr
    .find('td:nth-child(3)')
    .text()
    .trim()
  const [ref, norng] = jsCodeRegExp.exec($tr.attr('onclick')).slice(1, 3)
  return {
    period,
    employee,
    amount,
    ref,
    norng
  }
}

function fetchPayslipFiles(payslipsByEmployee, folderPath) {
  return Promise.all(
    map(payslipsByEmployee, (payslips, employee) => {
      const files = payslips.map(fileEntry)
      return mkdirp(folderPath, employee).then(() =>
        saveFiles(files, `${folderPath}/${employee}`)
      )
    })
  )
}

function fileEntry({ period, ref, norng }) {
  return {
    fileurl: downloadUrl,
    filename: `${period}.pdf`,
    requestOptions: {
      method: 'POST',
      formData: {
        ref,
        norng
      }
    }
  }
}
