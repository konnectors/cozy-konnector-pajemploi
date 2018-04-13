const { log, cozyClient } = require('cozy-konnector-libs')

module.exports = {
  mkdirp
}

// create a folder if it does not already exist
function mkdirp(path, folderName) {
  return cozyClient.files.statByPath(`${path}/${folderName}`).catch(err => {
    if (err.status != 404) throw err
    log('info',
      `${path}/${folderName} folder does not exist yet, creating it: ${
        err.message
      }`)
    return cozyClient.files.statByPath(`${path}`).then(parentFolder =>
      cozyClient.files.createDirectory({
        name: folderName,
        dirID: parentFolder._id
      })
    )
  })
}
