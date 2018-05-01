const period = require('./period')

describe('period', () => {
  describe('parse', () => {
    it('returns an array representation of the french period string', () => {
      expect(period.parse('01/2018')).toEqual(['2018', '01'])
    })

    it('works with ISO dates, which happen for unknown reason', () => {
      expect(period.parse('2017-02-01 00:00:00.0')).toEqual(['2017', '02'])
    })
  })

  describe('range', () => {
    it("builds a period range from pajemploiCreation up to the given date's month & year", () => {
      expect(period.range(new Date(2018, 2))).toEqual({
        start: period.pajemploiCreation,
        end: {
          month: '03',
          year: '2018'
        }
      })
    })
  })

  describe('rangeToSentence', () => {
    it('returns a human-friendly description of the period range', () => {
      expect(
        period.rangeToSentence({
          start: {
            year: '2010',
            month: '02'
          },
          end: {
            year: '2013',
            month: '04'
          }
        })
      ).toEqual('from 02/2010 to 04/2013')
    })
  })
})
