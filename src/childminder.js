const { log, saveFiles } = require('cozy-konnector-libs')
const groupBy = require('lodash.groupby')
const map = require('lodash.map')

const {
  baseUrl,
  downloadUrl,
  mkdirp,
  parsePeriod,
  request
} = require('./common')

const listUrl = baseUrl + '/attesemploisala.jsp'
const rowsPerPage = 10

module.exports = {
  fetchPayslips
}

function fetchPayslips(period, folderPath) {
  return fetchPagesCount(period)
    .then(function(pagesCount) {
      log('info', `Found ${pagesCount} employee payslips page(s)`)

      let payslipsPromise = Promise.resolve([])

      for (let pageNumber = 1; pageNumber <= pagesCount; pageNumber++) {
        payslipsPromise = payslipsPromise.then(function(payslips) {
          return requestPayslipsPage(period, pageNumber).then($ => {
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

function fetchPagesCount(period) {
  return requestPayslipsPage(period).then(parsePagesCount)
}

function parsePagesCount($) {
  return parseInt(
    $(`form[name="etat"]`)
      .prev('div')
      .find('a:last-child')
      .text()
  )
}

function requestPayslipsPage(period, pageNumber) {
  pageNumber = pageNumber || 1
  const offset = (pageNumber - 1) * rowsPerPage

  return request({
    method: 'POST',
    uri: listUrl,
    form: {
      typeActivite: 'A',
      debutAnneePeriode: period.startYear,
      debutMoisPeriode: period.startMonth,
      finAnneePeriode: period.endYear,
      finMoisPeriode: period.endMonth,
      psdoSirt: '', // All employers
      nbStart: offset.toString(),
      order: 'periode',
      choixDate: 'emploi'
    }
  })
}

function parsePayslipsPage($, pageNumber) {
  log('info', `Parsing employee payslips page ${pageNumber}...`)
  return Array.from(
    $('table tr:has(>.tableau-cellule1,>.tableau-cellule2)')
  ).map(tr => parsePayslipRow($(tr)))
}

function parsePayslipRow($tr) {
  const employer = $tr.find('td:nth-child(2)').text()
  const period = parsePeriod($tr.find('td:nth-child(3)').text())
  const amount = parseFloat($tr.find('td:nth-child(4)').text())
  const ref = $tr
    .find('td:nth-child(1) a[alt="Bulletin de salaire"]')
    .attr('href')
    .split('=')[1]

  return {
    employer,
    period,
    amount,
    ref
  }
}

function fetchPayslipFiles(payslipsByEmployer, folderPath) {
  return Promise.all(
    map(payslipsByEmployer, (payslips, employer) => {
      const files = payslips.map(fileEntry)
      return mkdirp(folderPath, employer).then(() =>
        saveFiles(files, `${folderPath}/${employer}`)
      )
    })
  )
}

function fileEntry({ period, ref }) {
  return {
    fileurl: downloadUrl,
    filename: `${period}.pdf`,
    requestOptions: {
      qs: {
        ref
      }
    }
  }
}
