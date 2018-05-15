const payslip = require('./payslip')

describe('payslip', () => {
  describe('fileEntry', () => {
    it('uses POST request for an employer', () => {
      expect(
        payslip.fileEntry({
          period: '2018-01',
          ref: '123',
          norng: '456'
        })
      ).toEqual({
        fileurl: payslip.downloadUrl,
        filename: '2018-01.pdf',
        requestOptions: {
          method: 'POST',
          formData: {
            ref: '123',
            norng: '456'
          }
        }
      })
    })
  })
})
