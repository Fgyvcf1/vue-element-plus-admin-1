<template>
  <div class="archive-detail-container">
    <el-card>
      <div class="archive-header">
        <div class="archive-info">
          <h2>调解档案 - {{ archiveData.archive_id }}</h2>
          <el-tag :type="getStatusType(archiveData.status)" size="large">
            {{ getStatusText(archiveData.status) }}
          </el-tag>
        </div>
        <div class="archive-actions">
          <el-button @click="goBack">返回列表</el-button>
          <el-button v-if="!isViewMode" type="primary" :loading="saving" @click="handleSave"
            >保存</el-button
          >
        </div>
      </div>

      <el-tabs v-model="activeTab" class="archive-tabs">
        <!-- 调解申请书 -->
        <el-tab-pane label="调解申请书" name="application">
          <el-form :disabled="isViewMode" label-width="100px">
            <!-- 档案基本信息 -->
            <h4 class="section-title">档案基本信息</h4>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="档案编号">
                  <el-input v-model="archiveData.archive_id" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="纠纷类型">
                  <el-select
                    v-model="applicationForm.dispute_type"
                    placeholder="请选择"
                    style="width: 100%"
                  >
                    <el-option label="婚姻家庭纠纷" value="婚姻家庭纠纷" />
                    <el-option label="邻里纠纷" value="邻里纠纷" />
                    <el-option label="合同纠纷" value="合同纠纷" />
                    <el-option label="损害赔偿纠纷" value="损害赔偿纠纷" />
                    <el-option label="劳动争议" value="劳动争议" />
                    <el-option label="其他纠纷" value="其他纠纷" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="申请日期">
                  <el-date-picker
                    v-model="applicationForm.apply_date"
                    type="date"
                    placeholder="选择日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="发生日期">
                  <el-date-picker
                    v-model="applicationForm.occurrence_date"
                    type="date"
                    placeholder="选择日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="发生地点">
                  <el-input
                    v-model="applicationForm.occurrence_location"
                    placeholder="请输入地点"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 申请人信息 -->
            <div class="participant-section">
              <h4 class="section-title">
                申请人信息
                <el-button type="primary" size="small" :icon="Plus" circle @click="addApplicant" />
              </h4>
              <div
                v-for="(applicant, index) in applicationForm.applicants"
                :key="`app-${index}`"
                class="participant-card"
              >
                <div class="participant-header">
                  <span class="participant-index">申请人 {{ index + 1 }}</span>
                  <el-button
                    v-if="applicationForm.applicants.length > 1"
                    type="danger"
                    size="small"
                    :icon="Close"
                    circle
                    @click="removeApplicant(index)"
                  />
                </div>

                <!-- 第一行：姓名、身份证号、联系电话 -->
                <el-row :gutter="12">
                  <el-col :span="6">
                    <el-form-item label="姓名">
                      <el-autocomplete
                        v-model="applicant.name"
                        :fetch-suggestions="queryResidents"
                        placeholder="请输入姓名"
                        clearable
                        :trigger-on-focus="false"
                        @select="(item) => handleResidentSelect(item, 'applicant', index)"
                      >
                        <template #default="{ item }">
                          <div class="resident-option">
                            <span class="resident-name">{{ item.name }}</span>
                            <span class="resident-info">{{ item.idCard }} | {{ item.phone }}</span>
                          </div>
                        </template>
                      </el-autocomplete>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="身份证号">
                      <el-input
                        v-model="applicant.id_card"
                        placeholder="身份证号"
                        @input="(val) => handleIdCardInput(val, 'applicant', index)"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="联系电话">
                      <el-input v-model="applicant.phone" placeholder="联系电话" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="性别">
                      <el-select
                        v-model="applicant.gender"
                        placeholder="请选择"
                        style="width: 100%"
                      >
                        <el-option label="男" value="男" />
                        <el-option label="女" value="女" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <!-- 第二行：民族、年龄、职业 -->
                <el-row :gutter="12">
                  <el-col :span="5">
                    <el-form-item label="民族">
                      <el-input v-model="applicant.nation" placeholder="民族" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="年龄">
                      <el-input v-model="applicant.age" placeholder="年龄" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="职业/职务">
                      <el-input v-model="applicant.occupation" placeholder="职业或职务" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="9">
                    <el-form-item label="单位或住址">
                      <el-input v-model="applicant.address" placeholder="单位或住址" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>

            <!-- 被申请人信息 -->
            <div class="participant-section">
              <h4 class="section-title">
                被申请人信息
                <el-button type="primary" size="small" :icon="Plus" circle @click="addRespondent" />
              </h4>
              <div
                v-for="(respondent, index) in applicationForm.respondents"
                :key="`res-${index}`"
                class="participant-card"
              >
                <div class="participant-header">
                  <span class="participant-index">被申请人 {{ index + 1 }}</span>
                  <el-button
                    v-if="applicationForm.respondents.length > 1"
                    type="danger"
                    size="small"
                    :icon="Close"
                    circle
                    @click="removeRespondent(index)"
                  />
                </div>

                <!-- 第一行：姓名、身份证号、联系电话 -->
                <el-row :gutter="12">
                  <el-col :span="6">
                    <el-form-item label="姓名">
                      <el-autocomplete
                        v-model="respondent.name"
                        :fetch-suggestions="queryResidents"
                        placeholder="请输入姓名"
                        clearable
                        :trigger-on-focus="false"
                        @select="(item) => handleResidentSelect(item, 'respondent', index)"
                      >
                        <template #default="{ item }">
                          <div class="resident-option">
                            <span class="resident-name">{{ item.name }}</span>
                            <span class="resident-info">{{ item.idCard }} | {{ item.phone }}</span>
                          </div>
                        </template>
                      </el-autocomplete>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="身份证号">
                      <el-input
                        v-model="respondent.id_card"
                        placeholder="身份证号"
                        @input="(val) => handleIdCardInput(val, 'respondent', index)"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="联系电话">
                      <el-input v-model="respondent.phone" placeholder="联系电话" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="性别">
                      <el-select
                        v-model="respondent.gender"
                        placeholder="请选择"
                        style="width: 100%"
                      >
                        <el-option label="男" value="男" />
                        <el-option label="女" value="女" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <!-- 第二行：民族、年龄、职业 -->
                <el-row :gutter="12">
                  <el-col :span="5">
                    <el-form-item label="民族">
                      <el-input v-model="respondent.nation" placeholder="民族" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="年龄">
                      <el-input v-model="respondent.age" placeholder="年龄" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="职业/职务">
                      <el-input v-model="respondent.occupation" placeholder="职业或职务" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="9">
                    <el-form-item label="单位或住址">
                      <el-input v-model="respondent.address" placeholder="单位或住址" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>

            <!-- 纠纷详情 -->
            <h4 class="section-title">纠纷详情</h4>
            <el-form-item label="纠纷描述">
              <el-input
                v-model="applicationForm.dispute_description"
                type="textarea"
                :rows="4"
                placeholder="请详细描述纠纷情况"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="申请事项">
              <el-input
                v-model="applicationForm.request_content"
                type="textarea"
                :rows="3"
                placeholder="请输入申请调解的具体内容"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 调解记录 -->
        <el-tab-pane label="调解记录" name="record">
          <!-- 历史记录时间轴 -->
          <div v-if="recordsList.length > 0" class="records-timeline">
            <h4 class="section-title">历史调解记录</h4>
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in recordsList"
                :key="index"
                :timestamp="formatDate(record.mediation_date)"
                placement="top"
                type="primary"
              >
                <el-card shadow="hover">
                  <div class="timeline-header">
                    <span class="timeline-title">调解记录 #{{ recordsList.length - index }}</span>
                    <el-tag :type="record.agreement === 'yes' ? 'success' : 'info'" size="small">
                      {{ record.agreement === 'yes' ? '已达成协议' : '未达成协议' }}
                    </el-tag>
                  </div>
                  <div class="timeline-content">
                    <p><strong>调解地点：</strong>{{ record.mediation_location }}</p>
                    <p><strong>调解员：</strong>{{ record.mediators }}</p>
                    <p><strong>调解过程：</strong>{{ record.process_record }}</p>
                    <p><strong>调解结果：</strong>{{ record.mediation_result }}</p>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>

          <!-- 新增调解记录表单 -->
          <div class="new-record-section">
            <div class="section-header" @click="toggleRecordForm">
              <h4 class="section-title" style="margin: 0; cursor: pointer">
                {{ isRecordFormCollapsed ? '展开' : '收起' }}新增调解记录
              </h4>
              <el-icon :size="18" style="cursor: pointer">
                <ArrowDown v-if="isRecordFormCollapsed" />
                <ArrowUp v-else />
              </el-icon>
            </div>

            <el-collapse-transition>
              <div v-show="!isRecordFormCollapsed">
                <el-form :model="recordForm" label-width="100px" :disabled="isViewMode">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="调解日期" required>
                        <el-date-picker
                          v-model="recordForm.mediation_date"
                          type="date"
                          placeholder="选择调解日期"
                          value-format="YYYY-MM-DD"
                          style="width: 100%"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="调解地点">
                        <el-input
                          v-model="recordForm.mediation_location"
                          placeholder="请输入调解地点"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-form-item label="调解员">
                    <el-input
                      v-model="recordForm.mediators"
                      placeholder="请输入调解员姓名，多个用逗号分隔"
                      type="textarea"
                      :rows="2"
                    />
                  </el-form-item>

                  <el-form-item label="调解过程" required>
                    <el-input
                      v-model="recordForm.process_record"
                      type="textarea"
                      :rows="6"
                      placeholder="请详细记录调解过程"
                      maxlength="1000"
                      show-word-limit
                    />
                  </el-form-item>

                  <el-form-item label="调解结果">
                    <el-input
                      v-model="recordForm.mediation_result"
                      type="textarea"
                      :rows="4"
                      placeholder="请输入调解结果"
                      maxlength="500"
                      show-word-limit
                    />
                  </el-form-item>

                  <el-form-item label="是否达成协议">
                    <el-radio-group v-model="recordForm.agreement">
                      <el-radio label="yes">是</el-radio>
                      <el-radio label="no">否</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <!-- 图片上传 -->
                  <el-form-item label="现场图片">
                    <el-upload
                      action="#"
                      list-type="picture-card"
                      :auto-upload="false"
                      :file-list="recordImageList"
                      :on-change="handleImageChange"
                      :on-remove="handleImageRemove"
                      accept="image/*"
                    >
                      <el-icon><Plus /></el-icon>
                      <template #tip>
                        <div class="el-upload__tip">只能上传图片文件，单个文件不超过5MB</div>
                      </template>
                    </el-upload>
                  </el-form-item>
                </el-form>
              </div>
            </el-collapse-transition>
          </div>
        </el-tab-pane>

        <!-- 调解协议书 -->
        <el-tab-pane label="调解协议书" name="agreement" :disabled="!canEditAgreement">
          <el-alert
            v-if="!canEditAgreement"
            title="只有在调解记录中选择了「是」达成协议后才能填写协议书"
            type="info"
            :closable="false"
            show-icon
          />
          <template v-else>
            <el-form :disabled="isViewMode" label-width="120px">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="协议日期" required>
                    <el-date-picker
                      v-model="agreementForm.agreement_date"
                      type="date"
                      placeholder="选择协议日期"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="履行期限">
                    <el-input
                      v-model="agreementForm.performance_period"
                      placeholder="请输入履行期限"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="协议内容" required>
                <el-input
                  v-model="agreementForm.agreement_content"
                  type="textarea"
                  :rows="8"
                  placeholder="请输入详细的协议内容"
                  maxlength="2000"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="违约责任">
                <el-input
                  v-model="agreementForm.breach_liability"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入违约责任条款"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="甲方（签章）">
                    <el-input v-model="agreementForm.party_a_sign" placeholder="请输入甲方签章" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="乙方（签章）">
                    <el-input v-model="agreementForm.party_b_sign" placeholder="请输入乙方签章" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="调解员（签章）">
                    <el-input
                      v-model="agreementForm.mediator_sign"
                      placeholder="请输入调解员签章"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>

            <!-- 打印按钮 -->
            <div class="form-actions">
              <el-button type="warning" :icon="Printer" @click="showAgreementPrint"
                >打印协议</el-button
              >
            </div>
          </template>
        </el-tab-pane>

        <!-- 附件管理 -->
        <el-tab-pane label="附件管理" name="attachments">
          <div class="attachments-section">
            <el-alert
              title="支持上传图片、PDF、Word等文件，单个文件大小不超过10MB"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 16px"
            />
            <el-upload
              v-if="!isViewMode"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :file-list="fileList"
              :on-success="handleUploadSuccess"
              :on-remove="handleUploadRemove"
              :on-error="handleUploadError"
              multiple
              :limit="20"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            >
              <el-button type="primary" size="small" :icon="Upload">上传附件</el-button>
            </el-upload>

            <el-table :data="fileList" size="small" style="margin-top: 16px; width: 100%">
              <el-table-column prop="file_name" label="文件名" min-width="200" />
              <el-table-column prop="file_size" label="大小" width="100">
                <template #default="{ row }">
                  {{ formatFileSize(row?.file_size) }}
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="上传时间" width="180" />
              <el-table-column label="操作" width="200" align="center">
                <template #default="{ row }">
                  <el-button
                    v-if="canPreview(row.file_name)"
                    link
                    type="primary"
                    size="small"
                    :icon="View"
                    @click="handlePreview(row)"
                  >
                    预览
                  </el-button>
                  <el-button
                    link
                    type="success"
                    size="small"
                    :icon="Download"
                    @click="handleDownload(row)"
                  >
                    下载
                  </el-button>
                  <el-button
                    v-if="!isViewMode"
                    link
                    type="danger"
                    size="small"
                    :icon="Delete"
                    @click="handleDeleteFile(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 协议打印预览对话框 -->
    <el-dialog
      v-model="printDialogVisible"
      title="打印预览 - 人民调解协议书"
      width="900px"
      :close-on-click-modal="false"
    >
      <div id="printArea" class="agreement-print">
        <div class="print-header">
          <h1 class="print-title">人民调解协议书</h1>
          <div class="print-number">编号：{{ archiveData.archive_id }}</div>
        </div>

        <!-- 当事人信息 -->
        <div class="party-section">
          <div class="party-title">当事人（甲方）</div>
          <div class="party-row">
            <span class="party-label">姓名</span>
            <span class="party-value">{{ getFirstApplicantName() }}</span>
            <span class="party-label">性别</span>
            <span class="party-value short">{{ getFirstApplicantGender() }}</span>
            <span class="party-label">民族</span>
            <span class="party-value">{{ getFirstApplicantNation() }}</span>
            <span class="party-label">年龄</span>
            <span class="party-value short">{{ getFirstApplicantAge() }}</span>
          </div>
          <div class="party-row">
            <span class="party-label">职业或职务</span>
            <span class="party-value">{{ getFirstApplicantOccupation() }}</span>
            <span class="party-label">联系方式</span>
            <span class="party-value long">{{ getFirstApplicantPhone() }}</span>
          </div>
          <div class="party-row">
            <span class="party-label">单位或住址</span>
            <span class="party-value full">{{ getFirstApplicantAddress() }}</span>
          </div>
        </div>

        <div class="party-section">
          <div class="party-title">当事人（乙方）</div>
          <div class="party-row">
            <span class="party-label">姓名</span>
            <span class="party-value">{{ getFirstRespondentName() }}</span>
            <span class="party-label">性别</span>
            <span class="party-value short">{{ getFirstRespondentGender() }}</span>
            <span class="party-label">民族</span>
            <span class="party-value">{{ getFirstRespondentNation() }}</span>
            <span class="party-label">年龄</span>
            <span class="party-value short">{{ getFirstRespondentAge() }}</span>
          </div>
          <div class="party-row">
            <span class="party-label">职业或职务</span>
            <span class="party-value">{{ getFirstRespondentOccupation() }}</span>
            <span class="party-label">联系方式</span>
            <span class="party-value long">{{ getFirstRespondentPhone() }}</span>
          </div>
          <div class="party-row">
            <span class="party-label">单位或住址</span>
            <span class="party-value full">{{ getFirstRespondentAddress() }}</span>
          </div>
        </div>

        <!-- 纠纷事实 -->
        <div class="content-section">
          <div class="section-title-text">纠纷主要事实、争议事项：</div>
          <div
            v-for="(line, idx) in disputeDescriptionLines"
            :key="`dispute-${idx}`"
            class="print-line-row"
          >
            {{ line }}
          </div>
          <div
            v-for="n in 5 - disputeDescriptionLines.length"
            :key="`empty-${n}`"
            class="print-line-row"
          ></div>
        </div>

        <!-- 协议内容 -->
        <div class="content-section">
          <div class="section-title-text">经调解，自愿达成如下协议：</div>
          <div
            v-for="(line, idx) in agreementContentLines"
            :key="`agree-${idx}`"
            class="print-line-row"
          >
            {{ line }}
          </div>
          <div
            v-for="n in 4 - agreementContentLines.length"
            :key="`aempty-${n}`"
            class="print-line-row"
          ></div>
        </div>

        <!-- 履行方式 -->
        <div class="content-section">
          <div class="section-title-text">履行方式、时限</div>
          <div class="print-line-row">{{ agreementForm.performance_period || '' }}</div>
        </div>

        <!-- 协议份数 -->
        <div class="copies-section">
          本协议一式<u>&nbsp;&nbsp;三&nbsp;&nbsp;</u>份，当事人、人民调解委员会各持一份。
        </div>

        <!-- 签名区域 -->
        <div class="signature-section">
          <div class="signature-row">
            <span class="signature-label">当事人（签名盖章或按指印）</span>
            <span class="signature-value">{{ agreementForm.party_a_sign || '' }}</span>
            <span class="signature-label">人民调解员（签名）</span>
            <span class="signature-value">{{ agreementForm.mediator_sign || '' }}</span>
          </div>
          <div class="signature-row">
            <span class="signature-label">当事人（签名盖章或按指印）</span>
            <span class="signature-value">{{ agreementForm.party_b_sign || '' }}</span>
            <span class="signature-label">记录人（签名）</span>
            <span class="signature-value"></span>
          </div>
        </div>

        <!-- 印章和日期 -->
        <div class="footer-section">
          <div class="seal-area">人民调解委员会</div>
          <div class="date-area">
            <span class="date-text"
              >{{ agreementYear }}年{{ agreementMonth }}月{{ agreementDay }}日</span
            >
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="printDialogVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Close,
  ArrowDown,
  ArrowUp,
  Printer,
  Upload,
  View,
  Download,
  Delete
} from '@element-plus/icons-vue'
import {
  getArchiveDetail,
  saveApplication,
  saveRecord,
  saveAgreement,
  getAttachments,
  deleteAttachment,
  uploadRecordImages
} from '@/api/archive'
import { searchResidents } from '@/api/resident'

const route = useRoute()
const router = useRouter()

const archiveId = computed(() => String(route.params.id || ''))
const isViewMode = computed(() => route.query.mode !== 'edit')

// 档案基本信息
const archiveData = reactive({
  archive_id: '',
  status: 'pending'
})

// 申请书表单
const applicationForm = reactive({
  dispute_type: '',
  apply_date: '',
  occurrence_date: '',
  occurrence_location: '',
  dispute_description: '',
  request_content: '',
  applicants: [
    {
      name: '',
      id_card: '',
      phone: '',
      gender: '',
      nation: '汉族',
      age: '',
      occupation: '',
      address: ''
    }
  ],
  respondents: [
    {
      name: '',
      id_card: '',
      phone: '',
      gender: '',
      nation: '汉族',
      age: '',
      occupation: '',
      address: ''
    }
  ]
})

// 调解记录
const recordsList = ref<any[]>([])
const isRecordFormCollapsed = ref(false)
const recordForm = reactive({
  mediation_date: '',
  mediation_location: '',
  mediators: '',
  process_record: '',
  mediation_result: '',
  agreement: 'no'
})
const recordImageList = ref<any[]>([])

// 调解协议
const agreementForm = reactive({
  agreement_date: '',
  agreement_content: '',
  performance_period: '',
  breach_liability: '',
  party_a_sign: '',
  party_b_sign: '',
  mediator_sign: ''
})

// 附件
const fileList = ref<any[]>([])
const uploadUrl = computed(() => `/api/archives/${archiveId.value}/attachments`)
const uploadHeaders = ref({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })

// 打印对话框
const printDialogVisible = ref(false)

// 计算属性
const canEditAgreement = computed(() => {
  // 如果有历史记录且最新记录达成协议，或者当前表单选择了达成协议
  if (recordsList.value.length > 0 && recordsList.value[0].agreement === 'yes') {
    return true
  }
  return recordForm.agreement === 'yes'
})

const disputeDescriptionLines = computed(() => {
  if (!applicationForm.dispute_description) return []
  return applicationForm.dispute_description
    .split(/\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 5)
})

const agreementContentLines = computed(() => {
  if (!agreementForm.agreement_content) return []
  return agreementForm.agreement_content
    .split(/\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 4)
})

const agreementYear = computed(() => {
  if (!agreementForm.agreement_date) return '____'
  return new Date(agreementForm.agreement_date).getFullYear()
})

const agreementMonth = computed(() => {
  if (!agreementForm.agreement_date) return '____'
  return new Date(agreementForm.agreement_date).getMonth() + 1
})

const agreementDay = computed(() => {
  if (!agreementForm.agreement_date) return '____'
  return new Date(agreementForm.agreement_date).getDate()
})

// 状态
const saving = ref(false)
const activeTab = ref('application')

// 方法
const getStatusType = (status?: string) => {
  if (status === 'completed') return 'success'
  if (status === 'in_progress') return 'warning'
  return 'info'
}

const getStatusText = (status?: string) => {
  if (status === 'completed') return '已完成'
  if (status === 'in_progress') return '处理中'
  return '待处理'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return dateStr.substring(0, 10)
}

const formatFileSize = (size?: number) => {
  if (!size) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

// 申请人/被申请人操作
const addApplicant = () => {
  applicationForm.applicants.push({
    name: '',
    id_card: '',
    phone: '',
    gender: '',
    nation: '汉族',
    age: '',
    occupation: '',
    address: ''
  })
}

const removeApplicant = (index: number) => {
  if (applicationForm.applicants.length > 1) {
    applicationForm.applicants.splice(index, 1)
  }
}

const addRespondent = () => {
  applicationForm.respondents.push({
    name: '',
    id_card: '',
    phone: '',
    gender: '',
    nation: '汉族',
    age: '',
    occupation: '',
    address: ''
  })
}

const removeRespondent = (index: number) => {
  if (applicationForm.respondents.length > 1) {
    applicationForm.respondents.splice(index, 1)
  }
}

// 居民搜索
const queryResidents = async (query: string, callback: Function) => {
  if (!query || query.length < 1) {
    callback([])
    return
  }
  try {
    const res = await searchResidents({ keyword: query, page: 1, pageSize: 10 })
    const items = res.data?.items || res.data || []
    const suggestions = items.map((item: any) => ({
      value: item.name,
      ...item
    }))
    callback(suggestions)
  } catch (error) {
    callback([])
  }
}

const handleResidentSelect = (item: any, type: 'applicant' | 'respondent', index: number) => {
  const person =
    type === 'applicant' ? applicationForm.applicants[index] : applicationForm.respondents[index]
  person.name = item.name
  person.id_card = item.idCard || item.id_card || ''
  person.phone = item.phoneNumber || item.phone || ''
  person.gender = item.gender || ''
  person.nation = item.ethnicity || item.nation || '汉族'
  person.address = item.homeAddress || item.address || ''
  person.occupation = item.occupation || ''
  if (person.id_card && person.id_card.length === 18) {
    person.age = String(calculateAge(person.id_card))
  }
}

const handleIdCardInput = (val: string, type: 'applicant' | 'respondent', index: number) => {
  if (val && val.length === 18) {
    const person =
      type === 'applicant' ? applicationForm.applicants[index] : applicationForm.respondents[index]
    const genderCode = parseInt(val.substring(16, 17))
    person.gender = genderCode % 2 === 0 ? '女' : '男'
    person.age = String(calculateAge(val))
  }
}

const calculateAge = (idCard: string) => {
  const birthYear = parseInt(idCard.substring(6, 10))
  const birthMonth = parseInt(idCard.substring(10, 12))
  const birthDay = parseInt(idCard.substring(12, 14))
  const now = new Date()
  let age = now.getFullYear() - birthYear
  const monthDiff = now.getMonth() + 1 - birthMonth
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDay)) {
    age--
  }
  return age
}

// 获取第一个申请人/被申请人信息（用于打印）
const getFirstApplicantName = () => applicationForm.applicants[0]?.name || ''
const getFirstApplicantGender = () => applicationForm.applicants[0]?.gender || ''
const getFirstApplicantNation = () => applicationForm.applicants[0]?.nation || ''
const getFirstApplicantAge = () => applicationForm.applicants[0]?.age || ''
const getFirstApplicantOccupation = () => applicationForm.applicants[0]?.occupation || ''
const getFirstApplicantPhone = () => applicationForm.applicants[0]?.phone || ''
const getFirstApplicantAddress = () => applicationForm.applicants[0]?.address || ''

const getFirstRespondentName = () => applicationForm.respondents[0]?.name || ''
const getFirstRespondentGender = () => applicationForm.respondents[0]?.gender || ''
const getFirstRespondentNation = () => applicationForm.respondents[0]?.nation || ''
const getFirstRespondentAge = () => applicationForm.respondents[0]?.age || ''
const getFirstRespondentOccupation = () => applicationForm.respondents[0]?.occupation || ''
const getFirstRespondentPhone = () => applicationForm.respondents[0]?.phone || ''
const getFirstRespondentAddress = () => applicationForm.respondents[0]?.address || ''

// 调解记录折叠
const toggleRecordForm = () => {
  isRecordFormCollapsed.value = !isRecordFormCollapsed.value
}

const handleImageChange = (file: any, fileList: any[]) => {
  recordImageList.value = fileList
}

const handleImageRemove = (file: any, fileList: any[]) => {
  recordImageList.value = fileList
}

// 打印功能
const showAgreementPrint = () => {
  printDialogVisible.value = true
}

const handlePrint = () => {
  const printContent = document.getElementById('printArea')
  if (!printContent) return
  const originalContents = document.body.innerHTML
  document.body.innerHTML = printContent.innerHTML
  window.print()
  document.body.innerHTML = originalContents
  location.reload()
}

// 附件操作
const canPreview = (fileName?: string) => {
  if (!fileName) return false
  const previewTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  const lowerFileName = fileName.toLowerCase()
  return previewTypes.some((type) => lowerFileName.endsWith(type))
}

const handlePreview = (file: any) => {
  const imageTypes = ['.jpg', '.jpeg', '.png', '.gif']
  const fileName = file.file_name?.toLowerCase() || ''
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  if (imageTypes.some((type) => fileName.endsWith(type))) {
    window.open(`${baseUrl}${file.file_path}`, '_blank')
  } else if (fileName.endsWith('.pdf')) {
    window.open(`${baseUrl}${file.file_path}`, '_blank')
  }
}

const handleDownload = (file: any) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
  const a = document.createElement('a')
  a.href = `${baseUrl}${file.file_path}`
  a.download = file.file_name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const handleUploadSuccess = () => {
  ElMessage.success('上传成功')
  loadAttachments()
}

const handleUploadRemove = () => {
  console.log('移除文件')
}

const handleUploadError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败: ' + (error.message || '未知错误'))
}

const handleDeleteFile = async (file: any) => {
  try {
    await ElMessageBox.confirm('确认删除该附件吗？', '提示', { type: 'warning' })
    await deleteAttachment(archiveId.value, file.id)
    ElMessage.success('删除成功')
    loadAttachments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 加载数据
const loadArchiveDetail = async () => {
  try {
    const res = await getArchiveDetail(archiveId.value)
    const data = res.data || {}

    const archive = data.archive || data
    archiveData.archive_id = archive?.archive_id || ''
    archiveData.status = archive?.status || 'pending'

    // 申请书数据
    if (data.application) {
      Object.assign(applicationForm, data.application)
    }
    if (data.applicants && data.applicants.length > 0) {
      applicationForm.applicants = data.applicants
    }
    if (data.respondents && data.respondents.length > 0) {
      applicationForm.respondents = data.respondents
    }

    // 调解记录
    if (data.records && Array.isArray(data.records)) {
      recordsList.value = data.records.sort((a: any, b: any) => {
        return new Date(b.mediation_date).getTime() - new Date(a.mediation_date).getTime()
      })
    }

    // 调解协议
    if (data.agreement) {
      Object.assign(agreementForm, data.agreement)
    }
  } catch (error) {
    console.error('加载档案详情失败:', error)
    ElMessage.error('加载档案详情失败')
  }
}

const loadAttachments = async () => {
  try {
    const res = await getAttachments(archiveId.value)
    fileList.value = res.data || []
  } catch (error) {
    console.error('加载附件列表失败:', error)
  }
}

// 保存
const handleSave = async () => {
  saving.value = true
  try {
    if (activeTab.value === 'application') {
      await saveApplication(archiveId.value, applicationForm)
      ElMessage.success('申请书保存成功')
    } else if (activeTab.value === 'record') {
      // 保存调解记录
      await saveRecord(archiveId.value, recordForm)
      ElMessage.success('调解记录保存成功')

      // 上传图片
      if (recordImageList.value.length > 0) {
        const filesToUpload = recordImageList.value.filter((file) => file.raw)
        if (filesToUpload.length > 0) {
          const formData = new FormData()
          filesToUpload.forEach((file) => {
            formData.append('files', file.raw)
          })
          await uploadRecordImages(archiveId.value, formData)
          ElMessage.success('图片上传成功')
        }
      }

      // 重置表单
      recordForm.mediation_date = ''
      recordForm.mediation_location = ''
      recordForm.mediators = ''
      recordForm.process_record = ''
      recordForm.mediation_result = ''
      recordForm.agreement = 'no'
      recordImageList.value = []

      // 重新加载记录列表
      await loadArchiveDetail()
    } else if (activeTab.value === 'agreement') {
      await saveAgreement(archiveId.value, agreementForm)
      ElMessage.success('调解协议保存成功')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push('/mediation/archive')
}

onMounted(() => {
  loadArchiveDetail()
  loadAttachments()
})
</script>

<style scoped>
.archive-detail-container {
  padding: 16px;
}

.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.archive-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.archive-info h2 {
  margin: 0;
  font-size: 18px;
}

.archive-actions {
  display: flex;
  gap: 12px;
}

.archive-tabs :deep(.el-tabs__content) {
  padding: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 20px 0 15px 0;
  padding-left: 8px;
  border-left: 3px solid #409eff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.participant-section {
  margin-bottom: 20px;
}

.participant-card {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f9fafc;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.participant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.participant-index {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

.resident-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.resident-name {
  font-weight: bold;
  font-size: 14px;
}

.resident-info {
  font-size: 12px;
  color: #909399;
}

.records-timeline {
  margin-bottom: 30px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.timeline-title {
  font-weight: bold;
  font-size: 16px;
}

.timeline-content {
  font-size: 14px;
  line-height: 1.6;
}

.timeline-content p {
  margin: 8px 0;
}

.new-record-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 15px;
}

.section-header:hover {
  background-color: #e4e7ed;
}

.attachments-section {
  padding: 16px 0;
}

.form-actions {
  margin-top: 20px;
  text-align: center;
}

/* 打印样式 */
.agreement-print {
  font-family: 'SimSun', '宋体', serif;
  font-size: 14pt;
  line-height: 1.8;
  padding: 20px;
  max-width: 210mm;
  margin: 0 auto;
}

.print-header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.print-title {
  font-size: 22pt;
  font-weight: bold;
  margin: 0 0 20px 0;
  letter-spacing: 8px;
}

.print-number {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 12pt;
}

.party-section {
  margin-bottom: 15px;
}

.party-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 12pt;
}

.party-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.party-label {
  font-size: 12pt;
  margin-right: 5px;
  white-space: nowrap;
}

.party-value {
  font-size: 12pt;
  border-bottom: 1px solid #333;
  min-width: 60px;
  padding: 0 5px;
  text-align: center;
  margin-right: 15px;
  min-height: 20px;
}

.party-value.short {
  min-width: 40px;
  width: 40px;
}

.party-value.long {
  flex: 1;
  min-width: 200px;
  text-align: left;
}

.party-value.full {
  flex: 1;
  min-width: 300px;
  text-align: left;
}

.content-section {
  margin: 20px 0;
}

.section-title-text {
  font-size: 12pt;
  font-weight: bold;
  margin-bottom: 10px;
}

.print-line-row {
  border-bottom: 1px solid #333;
  height: 2em;
  line-height: 2;
  padding: 0 5px;
  box-sizing: border-box;
  font-size: 12pt;
}

.copies-section {
  font-size: 12pt;
  margin: 20px 0;
  text-align: left;
}

.copies-section u {
  font-weight: bold;
}

.signature-section {
  margin-top: 40px;
}

.signature-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 12pt;
}

.signature-label {
  white-space: nowrap;
}

.signature-value {
  border-bottom: 1px solid #333;
  min-width: 100px;
  text-align: center;
}

.footer-section {
  margin-top: 60px;
  text-align: right;
}

.seal-area {
  font-size: 12pt;
  margin-bottom: 20px;
}

.date-area {
  font-size: 12pt;
}

@media print {
  .agreement-print {
    padding: 0;
  }

  .party-value,
  .print-line-row,
  .signature-value {
    border-bottom: 1px solid #000;
  }
}
</style>
