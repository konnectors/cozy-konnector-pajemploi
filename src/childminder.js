const { log, normalizeFilename } = require('cozy-konnector-libs')
const groupBy = require('lodash.groupby')
const map = require('lodash.map')

const payslip = require('./payslip')
const period = require('./period')
const { baseUrl, request } = require('./request')

const listUrl = baseUrl + '/attesemploisala.jsp'
const rowsPerPage = 10

module.exports = {
  fetchPayslips
}

function fetchPayslips({ periodRange, folderPath }) {
  return fetchPagesCount(periodRange)
    .then(function(pagesCount) {
      log('info', `Found ${pagesCount} payslips page(s)`)

      let payslipsPromise = Promise.resolve([])

      for (let pageNumber = 1; pageNumber <= pagesCount; pageNumber++) {
        payslipsPromise = payslipsPromise.then(function(payslips) {
          return requestPayslipsPage(periodRange, pageNumber).then($ => {
            const newPayslips = parsePayslipsPage($, pageNumber)
            return payslips.concat(newPayslips)
          })
        })
      }

      return payslipsPromise
    })
    .then(payslips =>
      fetchPayslipFiles(groupBy(payslips, 'employer'), folderPath)
    )
}

function fetchPagesCount(periodRange) {
  return requestPayslipsPage(periodRange).then(parsePagesCount)
}

function parsePagesCount($) {
  return parseInt(
    $(`form[name="etat"]`)
      .prev('div')
      .find('a:last-child')
      .text()
  )
}

function requestPayslipsPage(periodRange, pageNumber) {
  pageNumber = pageNumber || 1
  const offset = (pageNumber - 1) * rowsPerPage

  return request({
    method: 'POST',
    uri: listUrl,
    form: {
      typeActivite: 'A',
      debutAnneePeriode: periodRange.start.year,
      debutMoisPeriode: periodRange.start.month,
      finAnneePeriode: periodRange.end.year,
      finMoisPeriode: periodRange.end.month,
      psdoSirt: '', // All employers
      nbStart: offset.toString(),
      order: 'periode',
      choixDate: 'emploi'
    }
  })
}

function parsePayslipsPage($, pageNumber) {
  log('info', `Parsing payslips page ${pageNumber}...`)
  return Array.from(
    $('table tr:has(>.tableau-cellule1,>.tableau-cellule2)')
  ).map(tr => parsePayslipRow($(tr)))
}

function parsePayslipRow($tr) {
  // For some reason, employer names are uppercase.
  const employer = $tr.find('td:nth-child(2)').text()
  const [year, month] = period.parse($tr.find('td:nth-child(3)').text())
  const amount = parseFloat($tr.find('td:nth-child(4)').text())
  const href = $tr
    .find('td:nth-child(1) a[alt="Bulletin de salaire"]')
    .attr('href')
  const ref = href && href.split('=')[1]

  return {
    employer,
    period: `${year}-${month}`,
    amount,
    ref
  }
}

function fetchPayslipFiles(payslipsByEmployer, folderPath) {
  return Promise.all(
    map(payslipsByEmployer, (payslips, employer) => {
      payslip.fetch({
        payslips,
        folderPath: `${folderPath}/${normalizeFilename(employer)}`
      })
    })
  )
}
