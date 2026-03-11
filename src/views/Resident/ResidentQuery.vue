<template>
  <div class="resident-query-container">
    <!-- 搜索表单区域 -->
    <el-form :inline="true" :model="queryParams" class="demo-form-inline">
      <!-- 原有搜索字段 -->
      <el-form-item label="居民姓名">
        <el-input v-model="queryParams.name" placeholder="姓名" />
      </el-form-item>
      <el-form-item label="身份证号">
        <el-input v-model="queryParams.idCard" placeholder="身份证" />
      </el-form-item>
      <el-form-item label="户主姓名">
        <el-input v-model="queryParams.householdName" placeholder="户主" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="queryParams.gender" placeholder="性别">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
      </el-form-item>
      <el-form-item label="村组">
        <el-select v-model="queryParams.villageGroup" placeholder="村组">
          <el-option label="村组1" value="group1" />
          <el-option label="村组2" value="group2" />
        </el-select>
      </el-form-item>
      <el-form-item label="出生年份">
        <el-date-picker
          v-model="queryParams.birthYear"
          type="year"
          placeholder="年份"
        />
      </el-form-item>
      <el-form-item label="联系电话">
        <el-input v-model="queryParams.phone" placeholder="电话" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryParams.status" placeholder="状态">
          <el-option label="正常" value="normal" />
          <el-option label="异常" value="abnormal" />
        </el-select>
      </el-form-item>

      <!-- 操作按钮区域 -->
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetForm">重置</el-button>
        <el-button type="success" @click="handleExport">导出</el-button>
        <el-button type="warning" @click="handleImport">导入</el-button>
        <!-- 将“人口增减上报”按钮移至右侧 -->
        <el-button type="info" @click="handlePopulationReport">人口增减上报</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格区域 -->
    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="序号" width="80" />
      <el-table-column prop="name" label="居民姓名" />
      <el-table-column prop="idCard" label="身份证号" />
      <el-table-column prop="gender" label="性别" />
      <el-table-column prop="householdName" label="户主姓名" />
      <el-table-column prop="relation" label="与户主关系" />
      <el-table-column prop="birthDate" label="出生日期" />
      <el-table-column prop="age" label="年龄" />
      <el-table-column prop="phone" label="联系电话" />
      <el-table-column prop="villageGroup" label="村组" />
      <el-table-column prop="address" label="家庭地址" />
    </el-table>
  </div>
</template>