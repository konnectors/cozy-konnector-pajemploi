const { log, normalizeFilename } = require('cozy-konnector-libs')
const groupBy = require('lodash.groupby')
const map = require('lodash.map')

const payslip = require('./payslip')
const period = require('./period')
const { baseUrl, request } = require('./request')

const listUrl = baseUrl + '/ajaxlistebs.jsp'

module.exports = {
  fetchPayslips
}

function fetchPayslips({ periodRange, folderPath }) {
  return fetchPayslipsMetadata(periodRange).then(payslipsByEmployee =>
    fetchPayslipFiles(payslipsByEmployee, folderPath)
  )
}

function fetchPayslipsMetadata(periodRange) {
  log('info', `Looking for payslips ${period.rangeToSentence(periodRange)}...`)

  return request({
    method: 'POST',
    uri: listUrl,
    form: {
      activite: 'T',
      byAsc: 'false',
      dtDebAnnee: periodRange.start.year,
      dtDebMois: periodRange.start.month,
      dtFinAnnee: periodRange.end.year,
      dtFinMois: periodRange.end.month,
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
  const periodString = $tr.find('td:nth-child(1)').text()
  const [year, month] = period.parse(periodString)
  const employee = $tr.find('td:nth-child(2)').text()
  const amount = $tr
    .find('td:nth-child(3)')
    .text()
    .trim()
  const [ref, norng] = jsCodeRegExp.exec($tr.attr('onclick')).slice(1, 3)
  return {
    period: `${year}-${month}`,
    employee,
    amount,
    ref,
    norng
  }
}

function fetchPayslipFiles(payslipsByEmployee, folderPath) {
  log('info', 'payslipsByEmployee=' + JSON.stringify(payslipsByEmployee))

  return Promise.all(
    map(payslipsByEmployee, (payslips, employee) =>
      payslip.fetch({
        payslips,
        folderPath: `${folderPath}/${normalizeFilename(employee)}`
      })
    )
  )
}
