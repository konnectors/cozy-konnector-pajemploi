const { mkdirp, saveFiles } = require('cozy-konnector-libs')

const { baseUrl } = require('./request')

const downloadUrl = baseUrl + '/paje_bulletinsalaire.pdf'

module.exports = {
  downloadUrl,
  fetch,
  fileEntry
}

function fetch({ payslips, folderPath }) {
  const files = payslips.map(fileEntry)
  return mkdirp(folderPath).then(() => saveFiles(files, folderPath))
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
