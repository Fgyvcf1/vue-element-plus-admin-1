/**
 * @deprecated
 * 特殊人群控制器已拆分为独立路由模块：
 * - 低收入：routes/lowIncomeRoutes.js
 * - 残疾人：routes/disabledPersonRoutes.js
 *
 * 本文件仅保留兼容占位，避免误引用旧文件时静默成功。
 */

function deprecatedHandler(req, res) {
  res.status(410).json({
    code: 410,
    message:
      'specialPeopleController is deprecated. Use lowIncomeRoutes/disabledPersonRoutes instead.'
  })
}

const specialPeopleController = {
  getLowIncomePersons: deprecatedHandler,
  getLowIncomePerson: deprecatedHandler,
  addLowIncomePerson: deprecatedHandler,
  addLowIncomePersonWithPolicy: deprecatedHandler,
  updateLowIncomePerson: deprecatedHandler,
  deleteLowIncomePerson: deprecatedHandler,
  getPolicyRecords: deprecatedHandler,
  addPolicyRecord: deprecatedHandler,
  updatePolicyRecord: deprecatedHandler,
  deletePolicyRecord: deprecatedHandler,
  getTotalMonths: deprecatedHandler,
  getHouseholdTotalSubsidy: deprecatedHandler,
  getDisabledPersons: deprecatedHandler,
  getDisabledPerson: deprecatedHandler,
  addDisabledPerson: deprecatedHandler,
  updateDisabledPerson: deprecatedHandler,
  deleteDisabledPerson: deprecatedHandler
}

module.exports = specialPeopleController
