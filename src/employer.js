const { log, normalizeFilename } = require('cozy-konnector-libs')
const groupBy = require('lodash.groupby')
const map = require('lodash.map')

const payslip = require('./payslip')
const period = require('./period')
const { baseUrl } = require('./request')

const listUrl = baseUrl + '/ajaxlistebs.jsp'
const attestUrl = baseUrl + '/atfirecap.htm'

module.exports = {
  fetchPayslips,
  fetchAttests
}

async function fetchPayslips({ periodRange, folderPath }) {
  const payslipsByEmployee = await fetchPayslipsMetadata.bind(this)(periodRange)
  return await fetchPayslipFiles.bind(this)(payslipsByEmployee, folderPath)
}

function fetchPayslipsMetadata(periodRange) {
  log('info', `Looking for payslips ${period.rangeToSentence(periodRange)}...`)

  return this.request({
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
        log('info', 'No payslips found.')
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
  log('debug', 'payslipsByEmployee=' + JSON.stringify(payslipsByEmployee))

  return Promise.all(
    map(payslipsByEmployee, (payslips, employee) =>
      payslip.fetch.bind(this)({
        payslips,
        folderPath: `${folderPath}/${normalizeFilename(employee)}`
      })
    )
  )
}

async function fetchAttests(fields) {
  log('info', 'Try to fetch attestations')
  const yearsList = await fetchAttestsYears.bind(this)()
  return await evalAndDownloadAttests.bind(this)(yearsList, fields)
}

function fetchAttestsYears() {
  log('info', `Fetching years for attestations`)
  return this.request({
    method: 'GET',
    uri: attestUrl
  }).then($ => {
    return Array.from(
      $('form')
        .attr('action', 'atfirecap.htm')
        .find('option')
    ).map(option => $(option).val())
  })
}

async function evalAndDownloadAttests(yearsList, fields) {
  let attestations = []
  for (const year of yearsList) {
    // Test if a pdf is available
    const $ = await this.request({
      method: 'POST',
      uri: attestUrl,
      form: {
        annee: parseInt(year)
      }
    })
    if ($.html().includes('Aucun volet social')) {
      log('debug', `No attestation available for ${year}`)
    } else if ($.html().includes('href="/pajeweb/paje_atfiempl.pdf?annee=')) {
      log('info', `Attestation found for year ${year}`)
      attestations.push({
        fileurl: baseUrl + `/paje_atfiempl.pdf?annee=${year}`,
        filename: `${year}_Attestation_fiscale.pdf`
      })
    } else {
      log('warn', `Unknown case for ${year} in attestation availability`)
    }
  }

  // Saving pdf available
  if (attestations.length > 0) {
    log('info', 'Saving attestations to cozy ...')
    await this.saveFiles(attestations, fields, {
      fileIdAttributes: ['fileurl']
    })
  }
}
