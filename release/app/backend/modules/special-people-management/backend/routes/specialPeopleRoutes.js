const express = require('express')
const router = express.Router()
const specialPeopleController = require('../controllers/specialPeopleController')

// 低收入人群API路由

// 获取所有低收入人群
router.get('/low-income-persons', specialPeopleController.getLowIncomePersons)

// 获取单个低收入人群
router.get('/low-income-persons/:id', specialPeopleController.getLowIncomePerson)

// 添加低收入人群
router.post('/low-income-persons', specialPeopleController.addLowIncomePerson)

// 更新低收入人群
router.put('/low-income-persons/:id', specialPeopleController.updateLowIncomePerson)

// 删除低收入人群
router.delete('/low-income-persons/:id', specialPeopleController.deleteLowIncomePerson)

// 残疾人API路由已移至 disabledPersonRoutes.js

// 低收入政策享受记录相关API路由

// 获取政策记录
router.get('/low-income-policy-records', specialPeopleController.getPolicyRecords)

// 添加政策记录
router.post('/low-income-policy-records', specialPeopleController.addPolicyRecord)

// 更新政策记录
router.put('/low-income-policy-records/:id', specialPeopleController.updatePolicyRecord)

// 删除政策记录
router.delete('/low-income-policy-records/:id', specialPeopleController.deletePolicyRecord)

// 获取单个成员的历史享受政策月数
router.get('/low-income-persons/:id/total-months', specialPeopleController.getTotalMonths)

// 获取该户所有成员享受总金额
router.get(
  '/low-income-persons/:id/household-total-subsidy',
  specialPeopleController.getHouseholdTotalSubsidy
)

module.exports = router
