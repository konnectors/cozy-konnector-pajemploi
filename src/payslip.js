const { mkdirp } = require('cozy-konnector-libs')

const { baseUrl } = require('./request')

const downloadUrl = baseUrl + '/paje_bulletinsalaire.pdf'

module.exports = {
  downloadUrl,
  fetch,
  fileEntry
}

function fetch({ payslips, folderPath }) {
  const files = payslips.map(fileEntry)
  return mkdirp(folderPath).then(() =>
    this.saveFiles(
      files.map(file => ({ ...file, folderPath })),
      { ...this.fields, folderPath },
      {
        contentType: 'application/pdf',
        fileIdAttributes: ['folderPath', 'filename']
      }
    )
  )
}

function fileEntry({ period, ref, norng }) {
  return {
    fileurl: downloadUrl,
    filename: `${period}.pdf`,
    fileAttributes: {
      metadata: {
        carbonCopy: true
      }
    },
    requestOptions: requestOptions({ ref, norng })
  }
}

function requestOptions({ ref, norng }) {
  return { method: 'POST', formData: { ref, norng } }
}
