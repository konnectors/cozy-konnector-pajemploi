const pajemploiCreation = {
  year: '2004',
  month: '01'
}

module.exports = {
  pajemploiCreation,
  parse,
  range,
  rangeToSentence
}

const frRegExp = /\s*(\d{2})\/(\d{4}).*/
const isoRegExp = /\s*(\d{4})-(\d{2}).*/

function parse(periodString) {
  const frMatch = frRegExp.exec(periodString)
  if (frMatch) return frMatch.slice(1, 3).reverse()
  else return isoRegExp.exec(periodString).slice(1, 3)
}

function range(endDate) {
  return {
    start: pajemploiCreation,
    end: {
      year: endDate.getFullYear().toString(),
      month: `0${endDate.getMonth() + 1}`.slice(-2)
    }
  }
}

function rangeToSentence(range) {
  return (
    `from ${range.start.month}/${range.start.year}` +
    ` to ${range.end.month}/${range.end.year}`
  )
}
