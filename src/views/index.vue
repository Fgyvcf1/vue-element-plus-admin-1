<script>
import request from '@/axios'

export default {
  data() {
    return {
      loading: true,
      lowIncomeCount: 0,
      disabledCount: 0,
      lowIncomeList: [],
      totalHousehold: 0, // 全户人数
      benefitRecipients: 0, // 享受人数
      monthlySubsidyTotal: 0, // 户月金额
      dictionaries: [] // 新增：存储字典数据
    };
  },
  async mounted() {
    await Promise.all([
      this.fetchLowIncomeSummary().catch(err => {
        console.warn('低收入人员数据获取失败:', err.message);
        this.lowIncomeCount = 0;
        this.lowIncomeList = [];
      }),
      this.fetchDisabledCount().catch(err => {
        console.warn('残疾人员数据获取失败:', err.message);
        this.disabledCount = 0;
      })
    ]);

    this.calculateStats(); // 计算统计值
    this.loading = false;
  },
  methods: {
    calculateStats() {
      const rows = Array.isArray(this.lowIncomeList) ? this.lowIncomeList : [];
      const householdMap = new Map();
      rows.forEach((item) => {
        const key = item.householdId || item.household_id || item.householdHeadName || item.household_head_name || item.resident_id || item.id;
        if (!householdMap.has(key)) {
          householdMap.set(key, item);
        }
      });

      const households = Array.from(householdMap.values());
      this.totalHousehold = households.reduce((sum, item) => {
        const count = Number(item.totalHouseholdMembers || 0);
        return sum + (Number.isFinite(count) ? count : 0);
      }, 0);
      this.benefitRecipients = this.lowIncomeCount;
      this.monthlySubsidyTotal = households.reduce((sum, item) => {
        const amount = Number(item.monthlyHouseholdAmount || 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0);
    },
    async fetchLowIncomeSummary() {
      try {
        const res = await request.get({
          url: '/low-income-persons',
          params: { pageNum: 1, pageSize: 200 }
        });
        const list = res?.data || [];
        this.lowIncomeList = Array.isArray(list) ? list : [];
        this.lowIncomeCount = Number(res?.total || this.lowIncomeList.length || 0);
      } catch (error) {
        console.warn('低收入人员数据获取失败:', error.message);
        this.lowIncomeCount = 0;
        this.lowIncomeList = [];
      }
    },
    async fetchDisabledCount() {
      try {
        const res = await request.get({
          url: '/disabled-persons',
          params: { pageNum: 1, pageSize: 1 }
        });
        this.disabledCount = Number(res?.total || (Array.isArray(res?.data) ? res.data.length : 0) || 0);
      } catch (error) {
        console.warn('残疾人员数据获取失败:', error.message);
        this.disabledCount = 0;
      }
    },
    async loadDictionaries() {
      try {
        const res = await request.get({
          url: '/dictionary/category',
          params: { category: 'ARCHIVE' }
        });
        this.dictionaries = Array.isArray(res?.data) ? res.data : [];
      } catch (error) {
        console.warn('获取字典数据失败:', error.message);
        this.dictionaries = [];
      }
    }
  }
};
</script>
