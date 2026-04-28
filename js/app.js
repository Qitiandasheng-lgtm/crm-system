// ============ 数据存储 ============
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('crm_' + key) || 'null') || []; } catch { return []; } },
  getObj(key, def) { try { return JSON.parse(localStorage.getItem('crm_' + key) || 'null') || def; } catch { return def; } },
  set(key, data) { localStorage.setItem('crm_' + key, JSON.stringify(data)); },
  genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
};

// ============ 系统设置（可自定义下拉选项）============
const DEFAULT_SETTINGS = {
  owners: ['张三', '李四', '王五', '赵六', '管理员'],
  industries: ['制造业', '汽车行业', '电子行业', '食品行业', '医药行业', '化工行业', '物流行业', '其他'],
  sources: ['展会获取', '老客户推荐', '网络询盘', '陌生拜访', '名片录入', '其他'],
  products: ['MES系统', '自动化产线', 'SCADA系统', 'WMS系统', '定制开发'],
  followupTypes: ['电话沟通', '拜访客户', '发送邮件', '微信沟通', '视频会议'],
  maintTypes: ['电话问候', '上门拜访', '发送资料', '节日祝福', '满意度回访']
};

function getSettings() {
  return DB.getObj('settings', DEFAULT_SETTINGS);
}

function saveSettings(settings) {
  DB.set('settings', settings);
}

// 刷新设置页面列表
function renderSettings() {
  const s = getSettings();
  const keys = ['owners', 'industries', 'sources', 'products', 'followupTypes'];
  const listIds = ['ownersList', 'industriesList', 'sourcesList', 'productsList', 'followupTypesList'];
  keys.forEach((key, i) => {
    const el = document.getElementById(listIds[i]);
    if (!el) return;
    el.innerHTML = (s[key] || []).map((item, idx) =>
      `<div class="settings-tag">
        <span>${item}</span>
        <button onclick="removeSettingItem('${key}',${idx})" title="删除"><i class="fas fa-times"></i></button>
      </div>`
    ).join('');
  });
  // 显示当前用户名到账号安全输入框
  const unEl = document.getElementById('newUsername');
  if (unEl) {
    const curUser = sessionStorage.getItem('crm_current_user') || localStorage.getItem('crm_username') || 'admin';
    unEl.placeholder = `当前用户名：${curUser}`;
    unEl.value = '';
  }
  // 清空密码框
  ['oldPassword','newPassword','confirmPassword'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const tipEl = document.getElementById('accountSecurityTip');
  if (tipEl) tipEl.textContent = '用户名和密码可分别单独修改，不填则不改';
  // 百度OCR已内置配置，无需手动设置
}

// 保存账号安全（修改用户名/密码）
function saveAccountSecurity() {
  const newUsername = document.getElementById('newUsername').value.trim();
  const oldPassword = document.getElementById('oldPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const tipEl = document.getElementById('accountSecurityTip');

  const curUsername = localStorage.getItem('crm_username') || 'admin';
  const curPassword = localStorage.getItem('crm_password') || 'crm888';

  let changed = false;

  // 修改用户名（单独修改，无需旧密码）
  if (newUsername) {
    if (newUsername.length < 2) { showToast('用户名至少2个字符', 'error'); return; }
    localStorage.setItem('crm_username', newUsername);
    sessionStorage.setItem('crm_current_user', newUsername);
    const userEl = document.getElementById('currentUserName');
    if (userEl) userEl.textContent = newUsername;
    changed = true;
  }

  // 修改密码（需填写旧密码）
  if (oldPassword || newPassword || confirmPassword) {
    if (!oldPassword) { showToast('请输入当前密码', 'error'); return; }
    if (oldPassword !== curPassword) { showToast('当前密码错误', 'error'); document.getElementById('oldPassword').value = ''; return; }
    if (!newPassword) { showToast('请输入新密码', 'error'); return; }
    if (newPassword.length < 6) { showToast('新密码至少6位', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('两次密码不一致', 'error'); document.getElementById('confirmPassword').value = ''; return; }
    localStorage.setItem('crm_password', newPassword);
    changed = true;
  }

  if (!changed) { showToast('未填写任何修改内容', 'error'); return; }

  // 清空输入框
  ['newUsername','oldPassword','newPassword','confirmPassword'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const curUser2 = localStorage.getItem('crm_username') || 'admin';
  const unEl = document.getElementById('newUsername');
  if (unEl) unEl.placeholder = `当前用户名：${curUser2}`;
  if (tipEl) { tipEl.textContent = '✅ 修改成功！下次登录生效'; tipEl.style.color = '#388e3c'; setTimeout(() => { if(tipEl) { tipEl.textContent = '用户名和密码可分别单独修改，不填则不改'; tipEl.style.color = '#888'; } }, 3000); }
  showToast('账号信息已更新！');
}

function addSettingItem(key) {
  const inputMap = { owners:'newOwnerInput', industries:'newIndustryInput', sources:'newSourceInput', products:'newProductInput', followupTypes:'newFollowupTypeInput' };
  const input = document.getElementById(inputMap[key]);
  if (!input) return;
  const val = input.value.trim();
  if (!val) { showToast('请输入内容', 'error'); return; }
  const s = getSettings();
  if (!s[key]) s[key] = [];
  if (s[key].includes(val)) { showToast('已存在相同选项', 'error'); return; }
  s[key].push(val);
  saveSettings(s);
  input.value = '';
  renderSettings();
  showToast('添加成功');
}

function removeSettingItem(key, idx) {
  const s = getSettings();
  if (!s[key]) return;
  s[key].splice(idx, 1);
  saveSettings(s);
  renderSettings();
  showToast('已删除');
}

// 填充某个 <select> 元素
function fillSelect(elId, items, addEmpty) {
  const el = document.getElementById(elId);
  if (!el) return;
  const prefix = addEmpty ? `<option value="">请选择</option>` : '';
  el.innerHTML = prefix + items.map(i => `<option value="${i}">${i}</option>`).join('');
}

// 刷新所有动态下拉框
function refreshAllSelects() {
  const s = getSettings();
  // 负责人
  ['lead-owner','cust-owner','opp-owner','contract-owner','proj-owner','maint-owner'].forEach(id => fillSelect(id, s.owners || []));
  // 行业
  ['cust-industry','card-industry'].forEach(id => fillSelect(id, s.industries || [], true));
  // 来源
  fillSelect('lead-source', s.sources || []);
  // 跟进方式
  fillSelect('followup-type', s.followupTypes || []);
  // 维护方式
  fillSelect('maint-type', s.maintTypes || []);
}

// 刷新商机模态框中的产品下拉（包含动态添加行）
function refreshProductSelects() {
  const s = getSettings();
  const opts = `<option value="">关联产品/方案</option>` + (s.products || []).map(p => `<option>${p}</option>`).join('');
  document.querySelectorAll('.need-product').forEach(el => el.innerHTML = opts);
}

// ============ 工具函数 ============
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.className = 'toast', 3000);
}

function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function daysDiff(dateStr) {
  if (!dateStr) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.floor((d - now) / 86400000);
}

function getStageLabel(stage) {
  const map = { needs_analysis:'需求分析', demo:'演示交流', proposal:'方案提交', negotiation:'商务谈判', won:'成交', lost:'失败' };
  return map[stage] || stage;
}

// 获取阶段对应的标签颜色
function getStageTagHtml(stage) {
  const colorMap = { needs_analysis:'tag-purple', demo:'tag-blue', proposal:'tag-orange', negotiation:'tag-orange', won:'tag-green', lost:'tag-gray' };
  return `<span class="tag ${colorMap[stage]||'tag-gray'}">${getStageLabel(stage)}</span>`;
}

function getStatusTag(status) {
  const map = {
    active: '<span class="tag tag-green">执行中</span>',
    completed: '<span class="tag tag-gray">已完成</span>',
    pending: '<span class="tag tag-orange">待审核</span>',
    preparing: '<span class="tag tag-purple">筹备中</span>',
    implementing: '<span class="tag tag-blue">实施中</span>',
    testing: '<span class="tag tag-orange">测试验收</span>'
  };
  return map[status] || `<span class="tag tag-gray">${status}</span>`;
}

function getLevelTag(level) {
  const map = { A:'<span class="tag tag-red">A级</span>', B:'<span class="tag tag-blue">B级</span>', C:'<span class="tag tag-gray">C级</span>' };
  return map[level] || level;
}

// ============ 导航 ============
const pageTitles = {
  dashboard:'工作台', leads:'线索管理', customers:'客户管理',
  opportunities:'商机管理', contracts:'合同管理', projects:'项目实施',
  followup:'跟进提醒', maintenance:'客户维护', settings:'系统设置'
};

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[page] || page;
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('overlay').classList.remove('active');
  // 同步移动端底部导航激活态
  document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
  const mobileNavItem = document.querySelector(`.mobile-nav-item[data-page="${page}"]`);
  if (mobileNavItem) mobileNavItem.classList.add('active');
  renderPage(page);
}

function renderPage(page) {
  switch(page) {
    case 'dashboard': renderDashboard(); break;
    case 'leads': renderLeads(); break;
    case 'customers': renderCustomers(); break;
    case 'opportunities': renderOpportunities(); break;
    case 'contracts': renderContracts(); break;
    case 'projects': renderProjects(); break;
    case 'followup': renderFollowup(); break;
    case 'maintenance': renderMaintenance(); break;
    case 'settings': renderSettings(); break;
  }
}

// ============ 模态框控制 ============
function openModal(id) {
  refreshAllSelects();
  refreshProductSelects();
  if (['addOppModal','addContractModal','addProjectModal','addFollowupModal','addMaintenanceModal'].includes(id)) {
    refreshCustomerSelects();
  }
  document.getElementById(id).classList.add('active');
  document.getElementById('overlay').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  // 只有无其他弹窗时才关遮罩
  const anyOpen = document.querySelectorAll('.modal.active').length > 0;
  if (!anyOpen) document.getElementById('overlay').classList.remove('active');
  // 停止语音
  if (id === 'addFollowupModal') stopVoice();
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  document.getElementById('overlay').classList.remove('active');
  stopVoice();
}

function refreshCustomerSelects() {
  const customers = DB.get('customers');
  const leads = DB.get('leads');
  const allOptions = [
    ...customers.map(c => `<option value="cust_${c.id}">${c.company}（${c.contact}）</option>`),
    ...leads.map(l => `<option value="lead_${l.id}">[线索] ${l.company}（${l.contact}）</option>`)
  ].join('');
  const custOnly = customers.map(c => `<option value="${c.id}">${c.company}</option>`).join('');
  ['opp-customer','followup-customer','maint-customer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<option value="">请选择</option>` + allOptions;
  });
  ['contract-customer','proj-customer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<option value="">请选择客户</option>` + custOnly;
  });
}

// ============ 工作台 ============
function renderDashboard() {
  const leads = DB.get('leads');
  const opps = DB.get('opportunities');
  const contracts = DB.get('contracts');
  const followups = DB.get('followups');
  const customers = DB.get('customers');
  const today = new Date(); today.setHours(0,0,0,0);
  const thisMonth = today.getMonth(), thisYear = today.getFullYear();

  // KPI 卡片
  const activeOpps = opps.filter(o => o.stage !== 'won' && o.stage !== 'lost').length;
  const monthContracts = contracts.filter(c => {
    if (!c.date) return false;
    const d = new Date(c.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const sumContractsMonth = monthContracts.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
  const todayFollowups = followups.filter(f => {
    if (!f.nextdate) return false;
    const d = new Date(f.nextdate); d.setHours(0,0,0,0);
    return d <= today;
  });

  document.getElementById('stat-month-contracts').textContent = `¥${sumContractsMonth.toFixed(1)}`;
  document.getElementById('stat-opps').textContent = activeOpps;
  document.getElementById('stat-customers').textContent = customers.length;
  document.getElementById('stat-reminders').textContent = todayFollowups.length;
  document.getElementById('followupBadge').textContent = todayFollowups.length;

  // 趋势文字
  document.getElementById('stat-month-trend').textContent = `▲ 本月 ${monthContracts.length} 笔签约`;

  // 漏斗（新横向漏斗）
  const leadsCount = leads.length;
  const demoCount = opps.filter(o => o.stage === 'demo').length;
  const needsCount = opps.filter(o => ['proposal','negotiation'].includes(o.stage)).length;
  const negCount = opps.filter(o => o.stage === 'negotiation').length;
  const wonCount = opps.filter(o => o.stage === 'won').length;
  const maxCount = Math.max(leadsCount, 1);

  const setFunnel = (id, num, color) => {
    const bar = document.getElementById(id);
    const numEl = document.getElementById(id + '-num');
    if (bar) {
      bar.textContent = num;
      bar.style.width = Math.max(Math.round(num / maxCount * 100), num > 0 ? 14 : 0) + '%';
      bar.style.background = color;
    }
    if (numEl) numEl.textContent = num;
  };
  setFunnel('funnel-leads', leadsCount, 'var(--info)');
  setFunnel('funnel-demo', demoCount, 'var(--primary-400)');
  setFunnel('funnel-needs', needsCount, 'var(--primary-500)');
  setFunnel('funnel-negotiation', negCount, 'var(--warning)');
  setFunnel('funnel-won', wonCount, 'var(--success)');

  // 金额汇总
  const sumOpps = opps.reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
  const sumOppsActive = opps.filter(o => !['won','lost'].includes(o.stage)).reduce((acc, o) => acc + (parseFloat(o.amount) || 0), 0);
  const sumContractsTotal = contracts.reduce((acc, c) => acc + (parseFloat(c.amount) || 0), 0);
  document.getElementById('sum-opps').textContent = `¥${sumOpps.toFixed(1)}万`;
  document.getElementById('sum-opps-active').textContent = `¥${sumOppsActive.toFixed(1)}万`;
  document.getElementById('sum-contracts-month').textContent = `¥${sumContractsMonth.toFixed(1)}万`;
  document.getElementById('sum-contracts-total').textContent = `¥${sumContractsTotal.toFixed(1)}万`;

  // 今日待办（新样式）
  const el = document.getElementById('todayTasks');
  if (todayFollowups.length === 0) {
    el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i> 今日暂无待跟进</div>';
  } else {
    el.innerHTML = todayFollowups.slice(0, 6).map(f => {
      const diff = daysDiff(f.nextdate);
      const dateText = diff < 0 ? `逾期${Math.abs(diff)}天` : (diff === 0 ? '今天' : `${diff}天后`);
      const dotColor = f.priority === 'high' ? 'var(--danger)' : (f.priority === 'low' ? 'var(--success)' : 'var(--warning)');
      return `<div class="reminder-item" onclick="navigateTo('followup')">
        <div class="reminder-dot" style="background:${dotColor}"></div>
        <div class="reminder-main">
          <div class="reminder-company">${f.customerName || '未知客户'}</div>
          <div class="reminder-desc">${f.type} · ${f.goal || '持续跟进'}</div>
        </div>
        <div class="reminder-time" style="color:${diff<=0?'var(--danger)':'var(--gray-400)'}">${dateText}</div>
      </div>`;
    }).join('');
  }

  // 最近动态
  const activities = DB.get('activities');
  const actEl = document.getElementById('recentActivities');
  if (activities.length === 0) {
    actEl.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i> 暂无动态记录</div>';
  } else {
    actEl.innerHTML = activities.slice(-10).reverse().map(a =>
      `<div class="activity-item">
        <div class="activity-icon"><i class="${a.icon}"></i></div>
        <div class="activity-content">
          <div class="activity-text">${a.text}</div>
          <div class="activity-time">${a.time}</div>
        </div>
      </div>`
    ).join('');
  }
}

function addActivity(text, icon = 'fas fa-info-circle') {
  const activities = DB.get('activities');
  activities.push({ text, icon, time: new Date().toLocaleString('zh-CN') });
  if (activities.length > 60) activities.shift();
  DB.set('activities', activities);
}

// ============ 线索管理 ============
function renderLeads() {
  const leads = DB.get('leads');
  const tbody = document.getElementById('leadsTableBody');
  if (leads.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无线索数据，点击"新增线索"开始</td></tr>'; return; }
  tbody.innerHTML = leads.map(l => {
    const diff = l.nextfollow ? daysDiff(l.nextfollow) : null;
    const dateText = diff === null ? '-' : diff < 0
      ? `<span style="color:#f44336">逾期${Math.abs(diff)}天</span>`
      : diff === 0 ? '<span style="color:#ff9800">今天</span>' : formatDate(l.nextfollow);
    return `<tr>
      <td><strong style="cursor:pointer;color:#1a237e" onclick="viewLeadDetail('${l.id}')">${l.company}</strong></td>
      <td>${l.contact}</td>
      <td><span class="tag tag-blue">${l.source}</span></td>
      <td>${l.status === 'converted' ? '<span class="tag tag-green">已转化</span>' : '<span class="tag tag-orange">跟进中</span>'}</td>
      <td>${l.owner}</td>
      <td>${dateText}</td>
      <td>
        <button class="action-btn view" onclick="viewLeadDetail('${l.id}')"><i class="fas fa-eye"></i></button>
        <button class="action-btn followup" onclick="quickFollowup('${l.company}','lead_${l.id}')"><i class="fas fa-bell"></i></button>
        <button class="action-btn del" onclick="deleteLead('${l.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function saveLead() {
  const company = document.getElementById('lead-company').value.trim();
  const contact = document.getElementById('lead-contact').value.trim();
  if (!company || !contact) { showToast('请填写公司名称和联系人', 'error'); return; }
  const lead = {
    id: DB.genId(), company, contact,
    phone: document.getElementById('lead-phone').value,
    source: document.getElementById('lead-source').value,
    owner: document.getElementById('lead-owner').value,
    nextfollow: document.getElementById('lead-nextfollow').value,
    note: document.getElementById('lead-note').value,
    status: 'active', createdAt: new Date().toISOString()
  };
  const leads = DB.get('leads'); leads.push(lead); DB.set('leads', leads);
  addActivity(`新增线索：${company}（${contact}）`, 'fas fa-user-plus');
  closeModal('addLeadModal');
  ['lead-company','lead-contact','lead-phone','lead-nextfollow','lead-note'].forEach(id => document.getElementById(id).value = '');
  showToast('线索保存成功！');
  renderPage('leads');
}

function deleteLead(id) {
  if (!confirm('确认删除此线索？')) return;
  DB.set('leads', DB.get('leads').filter(l => l.id !== id));
  showToast('已删除'); renderPage('leads');
}

function editLead(id) {
  const lead = DB.get('leads').find(l => l.id === id);
  if (!lead) return;
  closeModal('detailModal');
  refreshAllSelects();
  setTimeout(() => {
    document.getElementById('lead-company').value = lead.company || '';
    document.getElementById('lead-contact').value = lead.contact || '';
    document.getElementById('lead-phone').value = lead.phone || '';
    document.getElementById('lead-source').value = lead.source || '';
    document.getElementById('lead-owner').value = lead.owner || '';
    document.getElementById('lead-nextfollow').value = lead.nextfollow || '';
    document.getElementById('lead-note').value = lead.note || '';
    const saveBtn = document.querySelector('#addLeadModal .modal-footer .btn-primary');
    saveBtn.textContent = '保存修改';
    saveBtn.onclick = () => updateLead(id);
    document.querySelector('#addLeadModal .modal-header h3').textContent = '编辑线索';
    document.getElementById('addLeadModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  }, 100);
}

function updateLead(id) {
  const company = document.getElementById('lead-company').value.trim();
  const contact = document.getElementById('lead-contact').value.trim();
  if (!company || !contact) { showToast('请填写公司名称和联系人', 'error'); return; }
  const leads = DB.get('leads');
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  lead.company = company; lead.contact = contact;
  lead.phone = document.getElementById('lead-phone').value;
  lead.source = document.getElementById('lead-source').value;
  lead.owner = document.getElementById('lead-owner').value;
  lead.nextfollow = document.getElementById('lead-nextfollow').value;
  lead.note = document.getElementById('lead-note').value;
  DB.set('leads', leads);
  addActivity(`编辑线索：${company}`, 'fas fa-edit');
  closeModal('addLeadModal');
  // 重置按钮
  const saveBtn = document.querySelector('#addLeadModal .modal-footer .btn-primary');
  saveBtn.textContent = '保存线索'; saveBtn.onclick = saveLead;
  document.querySelector('#addLeadModal .modal-header h3').textContent = '新增线索';
  ['lead-company','lead-contact','lead-phone','lead-nextfollow','lead-note'].forEach(i => document.getElementById(i).value = '');
  showToast('线索已更新！'); renderPage('leads');
}

function viewLeadDetail(id) {
  const lead = DB.get('leads').find(l => l.id === id);
  if (!lead) return;
  const followups = DB.get('followups').filter(f => f.customerId === `lead_${id}`);
  document.getElementById('detailTitle').textContent = `线索详情：${lead.company}`;
  document.getElementById('detailContent').innerHTML = `
    <div class="detail-section">
      <h4>基本信息</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>公司名称</label><span>${lead.company}</span></div>
        <div class="detail-item"><label>联系人</label><span>${lead.contact}</span></div>
        <div class="detail-item"><label>电话</label><span>${lead.phone ? `<a href="tel:${lead.phone}" style="color:#1976d2">${lead.phone}</a>` : '-'}</span></div>
        <div class="detail-item"><label>来源</label><span>${lead.source}</span></div>
        <div class="detail-item"><label>负责人</label><span>${lead.owner}</span></div>
        <div class="detail-item"><label>下次跟进</label><span>${formatDate(lead.nextfollow)}</span></div>
        ${lead.note ? `<div class="detail-item" style="grid-column:1/-1"><label>备注</label><span>${lead.note}</span></div>` : ''}
      </div>
    </div>
    <div class="detail-section">
      <h4>跟进记录（${followups.length}条）</h4>
      <div class="followup-history">
        ${followups.length === 0 ? '<div class="empty-state" style="padding:16px"><i class="fas fa-comments"></i> 暂无跟进记录</div>' :
          followups.slice().reverse().map(f => `
            <div class="followup-history-item">
              <div class="fhi-header"><span>${f.type}</span><span>${f.createdAt ? new Date(f.createdAt).toLocaleString('zh-CN') : ''}</span></div>
              <div class="fhi-content">${f.content || '（无内容）'}</div>
              ${f.goal ? `<div style="color:#1976d2;font-size:12px;margin-top:4px">目标：${f.goal}</div>` : ''}
            </div>`).join('')}
      </div>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" onclick="editLead('${id}')"><i class="fas fa-edit"></i> 编辑线索</button>
      <button class="btn btn-primary btn-sm" onclick="quickFollowup('${lead.company}','lead_${id}');closeModal('detailModal')"><i class="fas fa-plus"></i> 新增跟进</button>
      <button class="btn btn-success btn-sm" onclick="convertLeadToCustomer('${id}');closeModal('detailModal')"><i class="fas fa-arrow-right"></i> 转为客户</button>
    </div>`;
  openModal('detailModal');
}

function convertLeadToCustomer(id) {
  const leads = DB.get('leads');
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  const customer = {
    id: DB.genId(), company: lead.company, contact: lead.contact,
    phone: lead.phone || '', email: '', industry: '其他', level: 'B',
    owner: lead.owner, address: '', note: lead.note || '',
    createdAt: new Date().toISOString()
  };
  const customers = DB.get('customers'); customers.push(customer); DB.set('customers', customers);
  lead.status = 'converted'; DB.set('leads', leads);
  addActivity(`线索转化为客户：${lead.company}`, 'fas fa-exchange-alt');
  showToast(`${lead.company} 已转为客户！`);
  renderPage('leads');
}

// ============ 客户管理 ============
function renderCustomers() {
  const customers = DB.get('customers');
  const tbody = document.getElementById('customersTableBody');
  if (customers.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无客户数据</td></tr>'; return; }
  tbody.innerHTML = customers.map(c => `<tr>
    <td><strong style="cursor:pointer;color:#1a237e" onclick="viewCustomerDetail('${c.id}')">${c.company}</strong></td>
    <td>${c.contact}</td>
    <td>${c.phone ? `<a href="tel:${c.phone}" style="color:#1976d2">${c.phone}</a>` : '-'}</td>
    <td>${c.industry}</td>
    <td>${getLevelTag(c.level)}</td>
    <td>${c.owner}</td>
    <td>
      <button class="action-btn view" onclick="viewCustomerDetail('${c.id}')"><i class="fas fa-eye"></i></button>
      <button class="action-btn followup" onclick="quickFollowup('${c.company}','cust_${c.id}')"><i class="fas fa-bell"></i></button>
      <button class="action-btn del" onclick="deleteCustomer('${c.id}')"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`).join('');
}

function saveCustomer() {
  const company = document.getElementById('cust-company').value.trim();
  const contact = document.getElementById('cust-contact').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  if (!company || !contact || !phone) { showToast('请填写公司名称、联系人和联系电话', 'error'); return; }
  // 重复客户校验
  const existing = DB.get('customers').find(c => c.company.trim() === company);
  if (existing) { showToast(`"${company}" 已是现有客户，请勿重复录入`, 'error'); return; }
  const customer = {
    id: DB.genId(), company, contact, phone,
    position: document.getElementById('cust-position').value.trim(),
    email: document.getElementById('cust-email').value,
    industry: document.getElementById('cust-industry').value,
    level: document.getElementById('cust-level').value,
    owner: document.getElementById('cust-owner').value,
    address: document.getElementById('cust-address').value,
    note: document.getElementById('cust-note').value,
    createdAt: new Date().toISOString()
  };
  const customers = DB.get('customers'); customers.push(customer); DB.set('customers', customers);
  addActivity(`新增客户：${company}（${customer.level}级）`, 'fas fa-users');
  closeModal('addCustomerModal');
  ['cust-company','cust-contact','cust-position','cust-phone','cust-email','cust-address','cust-note'].forEach(id => document.getElementById(id).value = '');
  const sb = document.getElementById('custCompanySuggest'); if(sb) sb.style.display='none';
  showToast('客户保存成功！'); renderPage('customers');
}

function deleteCustomer(id) {
  if (!confirm('确认删除此客户？')) return;
  DB.set('customers', DB.get('customers').filter(c => c.id !== id));
  showToast('已删除'); renderPage('customers');
}

function editCustomer(id) {
  const c = DB.get('customers').find(c => c.id === id);
  if (!c) return;
  closeModal('detailModal');
  refreshAllSelects();
  setTimeout(() => {
    document.getElementById('cust-company').value = c.company || '';
    document.getElementById('cust-contact').value = c.contact || '';
    document.getElementById('cust-position').value = c.position || '';
    document.getElementById('cust-phone').value = c.phone || '';
    document.getElementById('cust-email').value = c.email || '';
    document.getElementById('cust-industry').value = c.industry || '';
    document.getElementById('cust-level').value = c.level || 'B';
    document.getElementById('cust-owner').value = c.owner || '';
    document.getElementById('cust-address').value = c.address || '';
    document.getElementById('cust-note').value = c.note || '';
    const sb = document.getElementById('custCompanySuggest'); if(sb) sb.style.display='none';
    const saveBtn = document.querySelector('#addCustomerModal .modal-footer .btn-primary');
    saveBtn.textContent = '保存修改';
    saveBtn.onclick = () => updateCustomer(id);
    document.querySelector('#addCustomerModal .modal-header h3').textContent = '编辑客户';
    document.getElementById('addCustomerModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  }, 100);
}

function updateCustomer(id) {
  const company = document.getElementById('cust-company').value.trim();
  const contact = document.getElementById('cust-contact').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  if (!company || !contact || !phone) { showToast('请填写公司名称、联系人和联系电话', 'error'); return; }
  const customers = DB.get('customers');
  const c = customers.find(c => c.id === id);
  if (!c) return;
  c.company = company; c.contact = contact; c.phone = phone;
  c.position = document.getElementById('cust-position').value.trim();
  c.email = document.getElementById('cust-email').value;
  c.industry = document.getElementById('cust-industry').value;
  c.level = document.getElementById('cust-level').value;
  c.owner = document.getElementById('cust-owner').value;
  c.address = document.getElementById('cust-address').value;
  c.note = document.getElementById('cust-note').value;
  DB.set('customers', customers);
  addActivity(`编辑客户：${company}`, 'fas fa-edit');
  closeModal('addCustomerModal');
  const saveBtn = document.querySelector('#addCustomerModal .modal-footer .btn-primary');
  saveBtn.textContent = '保存客户'; saveBtn.onclick = saveCustomer;
  document.querySelector('#addCustomerModal .modal-header h3').textContent = '新增客户';
  ['cust-company','cust-contact','cust-position','cust-phone','cust-email','cust-address','cust-note'].forEach(i => document.getElementById(i).value = '');
  const sb = document.getElementById('custCompanySuggest'); if(sb) sb.style.display='none';
  showToast('客户信息已更新！'); renderPage('customers');
}

function viewCustomerDetail(id) {
  const c = DB.get('customers').find(c => c.id === id);
  if (!c) return;
  const followups = DB.get('followups').filter(f => f.customerId === `cust_${id}`);
  const opps = DB.get('opportunities').filter(o => o.customerId === id || o.customerId === `cust_${id}`);
  document.getElementById('detailTitle').textContent = `客户详情：${c.company}`;
  document.getElementById('detailContent').innerHTML = `
    <div class="detail-section">
      <h4>基本信息</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>公司名称</label><span>${c.company}</span></div>
        <div class="detail-item"><label>联系人</label><span>${c.contact}${c.position ? ` <em style="color:#888;font-size:12px">（${c.position}）</em>` : ''}</span></div>
        <div class="detail-item"><label>电话</label><span>${c.phone ? `<a href="tel:${c.phone}" style="color:#1976d2">${c.phone}</a>` : '-'}</span></div>
        <div class="detail-item"><label>邮箱</label><span>${c.email || '-'}</span></div>
        <div class="detail-item"><label>行业</label><span>${c.industry}</span></div>
        <div class="detail-item"><label>客户等级</label>${getLevelTag(c.level)}</div>
        <div class="detail-item"><label>负责人</label><span>${c.owner}</span></div>
        <div class="detail-item"><label>地址</label><span>${c.address || '-'}</span></div>
        ${c.note ? `<div class="detail-item" style="grid-column:1/-1"><label>备注</label><span>${c.note}</span></div>` : ''}
      </div>
    </div>
    <div class="detail-section">
      <h4>关联商机（${opps.length}个）</h4>
      ${opps.length === 0 ? '<div style="color:#bbb;font-size:13px;padding:4px 0">暂无商机</div>' :
        opps.map(o => `<div style="background:#f8f9ff;border-radius:8px;padding:10px;margin-bottom:6px;cursor:pointer" onclick="closeModal('detailModal');viewOppDetail('${o.id}')">
          <strong>${o.name}</strong> · ${getStageLabel(o.stage)} · 
          <span style="color:#388e3c">${o.amount ? '¥'+o.amount+'万' : '金额待定'}</span>
        </div>`).join('')}
    </div>
    <div class="detail-section">
      <h4>跟进记录（${followups.length}条）</h4>
      <div class="followup-history">
        ${followups.length === 0 ? '<div style="color:#bbb;font-size:13px;padding:4px 0">暂无跟进记录</div>' :
          followups.slice().reverse().slice(0,5).map(f => `
            <div class="followup-history-item">
              <div class="fhi-header"><span>${f.type}</span><span>${f.createdAt ? new Date(f.createdAt).toLocaleString('zh-CN') : ''}</span></div>
              <div class="fhi-content">${f.content || '（无内容）'}</div>
            </div>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-outline btn-sm" onclick="editCustomer('${id}')"><i class="fas fa-edit"></i> 编辑客户</button>
      <button class="btn btn-outline btn-sm" onclick="quickFollowup('${c.company}','cust_${id}');closeModal('detailModal')"><i class="fas fa-bell"></i> 新增跟进</button>
      <button class="btn btn-primary btn-sm" onclick="closeModal('detailModal');openModal('addOppModal')"><i class="fas fa-fire"></i> 新增商机</button>
    </div>`;
  openModal('detailModal');
}

// ============ 商机管理 ============
// 当前视图模式: 'kanban' | 'list'
let oppViewMode = 'kanban';

function switchOppView(mode) {
  oppViewMode = mode;
  const kanban = document.getElementById('oppKanban');
  const listView = document.getElementById('oppListView');
  const btnKanban = document.getElementById('btnKanban');
  const btnList = document.getElementById('btnList');
  if (mode === 'kanban') {
    if (kanban) kanban.style.display = '';
    if (listView) listView.style.display = 'none';
    if (btnKanban) btnKanban.classList.add('active');
    if (btnList) btnList.classList.remove('active');
  } else {
    if (kanban) kanban.style.display = 'none';
    if (listView) listView.style.display = '';
    if (btnKanban) btnKanban.classList.remove('active');
    if (btnList) btnList.classList.add('active');
  }
  renderOpportunitiesWithFilter();
}

function renderOpportunitiesWithFilter() {
  const keyword = (document.getElementById('oppSearchInput')?.value || '').trim().toLowerCase();
  const stageFilter = document.getElementById('oppStageFilter')?.value || '';
  const allOpps = DB.get('opportunities');
  const filtered = allOpps.filter(o => {
    const matchKeyword = !keyword || (o.name||'').toLowerCase().includes(keyword) || (o.customerName||'').toLowerCase().includes(keyword);
    const matchStage = !stageFilter || o.stage === stageFilter;
    return matchKeyword && matchStage;
  });
  if (oppViewMode === 'list') {
    renderOppList(filtered);
  } else {
    renderOppKanban(filtered);
  }
}

function renderOpportunities() {
  renderOpportunitiesWithFilter();
}

function renderOppKanban(opps) {
  ['needs_analysis','demo','proposal','negotiation','won','lost'].forEach(stage => {
    const container = document.getElementById('kanban-' + stage);
    if (!container) return;
    const stageOpps = opps.filter(o => o.stage === stage);
    container.innerHTML = stageOpps.length === 0
      ? '<div style="text-align:center;padding:16px;color:#ccc;font-size:12px">暂无</div>'
      : stageOpps.map(o => `
        <div class="kanban-card" onclick="viewOppDetail('${o.id}')">
          <div class="kanban-card-title">${o.name}</div>
          <div class="kanban-card-meta">${o.customerName || '未关联客户'} · ${o.owner}</div>
          ${o.amount ? `<div class="kanban-card-amount">¥${o.amount}万</div>` : ''}
          ${o.closedate ? `<div class="kanban-card-meta" style="margin-top:4px"><i class="fas fa-calendar" style="font-size:10px"></i> ${formatDate(o.closedate)}</div>` : ''}
          ${stage === 'won' ? `<div style="margin-top:6px"><button class="btn btn-sm" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;font-size:12px;padding:3px 8px" onclick="event.stopPropagation();createContractFromOpp('${o.id}')"><i class="fas fa-file-contract"></i> 建立合同</button></div>` : ''}
          ${stage === 'lost' ? `<button class="btn btn-sm btn-danger" style="margin-top:6px;font-size:12px;padding:3px 8px;width:100%" onclick="event.stopPropagation();deleteOpp('${o.id}')"><i class="fas fa-trash"></i> 删除</button>` : ''}
        </div>`).join('');
    // 更新列头数量徽章
    const countEl = document.getElementById('kanban-' + stage + '-count');
    if (countEl) countEl.textContent = stageOpps.length;
  });
}

function renderOppList(opps) {
  const tbody = document.getElementById('oppListBody');
  if (!tbody) return;
  if (opps.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无商机数据</td></tr>'; return; }
  tbody.innerHTML = opps.map(o => `<tr>
    <td><strong style="cursor:pointer;color:#1976d2" onclick="viewOppDetail('${o.id}')">${o.name}</strong></td>
    <td>${o.customerName || '-'}</td>
    <td>${getStageTagHtml(o.stage)}</td>
    <td style="color:#388e3c;font-weight:600">${o.amount ? '¥'+o.amount+'万' : '-'}</td>
    <td>${o.owner || '-'}</td>
    <td>${formatDate(o.closedate)}</td>
    <td>
      <button class="action-btn view" onclick="viewOppDetail('${o.id}')" title="查看"><i class="fas fa-eye"></i></button>
      <button class="action-btn edit" onclick="editOpp('${o.id}')" title="编辑"><i class="fas fa-edit"></i></button>
      ${o.stage === 'won' ? `<button class="action-btn" style="color:#388e3c" onclick="createContractFromOpp('${o.id}')" title="建立合同"><i class="fas fa-file-contract"></i></button>` : ''}
      ${o.stage === 'lost' ? `<button class="action-btn del" onclick="deleteOpp('${o.id}')" title="删除"><i class="fas fa-trash"></i></button>` : ''}
    </td>
  </tr>`).join('');
}

function addNeedItem() {
  const list = document.getElementById('needsList');
  const s = getSettings();
  const opts = `<option value="">关联产品/方案</option>` + (s.products || []).map(p => `<option>${p}</option>`).join('');
  const div = document.createElement('div');
  div.className = 'need-item';
  div.innerHTML = `<input type="text" placeholder="需求描述" class="need-desc">
    <select class="need-product">${opts}</select>
    <input type="number" placeholder="预估金额(万)" class="need-amount">`;
  list.appendChild(div);
}

function saveOpportunity() {
  const name = document.getElementById('opp-name').value.trim();
  if (!name) { showToast('请填写商机名称', 'error'); return; }
  const custVal = document.getElementById('opp-customer').value;
  let customerName = '';
  if (custVal) {
    const custId = custVal.replace('cust_','').replace('lead_','');
    const found = [...DB.get('customers'), ...DB.get('leads')].find(c => c.id === custId);
    if (found) customerName = found.company;
  }
  const needs = [];
  document.querySelectorAll('#needsList .need-item').forEach(item => {
    const desc = item.querySelector('.need-desc').value;
    const product = item.querySelector('.need-product').value;
    const amount = item.querySelector('.need-amount').value;
    if (desc) needs.push({ desc, product, amount });
  });
  const opp = {
    id: DB.genId(), name, customerId: custVal, customerName,
    amount: document.getElementById('opp-amount').value,
    stage: document.getElementById('opp-stage').value,
    owner: document.getElementById('opp-owner').value,
    closedate: document.getElementById('opp-closedate').value,
    note: document.getElementById('opp-note').value,
    needs, createdAt: new Date().toISOString()
  };
  const opps = DB.get('opportunities'); opps.push(opp); DB.set('opportunities', opps);
  addActivity(`新增商机：${name}（${getStageLabel(opp.stage)}）`, 'fas fa-fire');
  closeModal('addOppModal');
  ['opp-name','opp-amount','opp-closedate','opp-note'].forEach(id => document.getElementById(id).value = '');
  const s = getSettings();
  const defaultOpts = `<option value="">关联产品/方案</option>` + (s.products || []).map(p => `<option>${p}</option>`).join('');
  document.getElementById('needsList').innerHTML = `<div class="need-item">
    <input type="text" placeholder="需求描述" class="need-desc">
    <select class="need-product">${defaultOpts}</select>
    <input type="number" placeholder="预估金额(万)" class="need-amount">
  </div>`;
  showToast('商机保存成功！'); renderPage('opportunities');
}

function viewOppDetail(id) {
  const opp = DB.get('opportunities').find(o => o.id === id);
  if (!opp) return;
  document.getElementById('detailTitle').textContent = `商机详情：${opp.name}`;
  document.getElementById('detailContent').innerHTML = `
    <div class="detail-section">
      <h4>商机信息</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>商机名称</label><span>${opp.name}</span></div>
        <div class="detail-item"><label>关联客户</label><span>${opp.customerName || '-'}</span></div>
        <div class="detail-item"><label>阶段</label><span>${getStageLabel(opp.stage)}</span></div>
        <div class="detail-item"><label>预计金额</label><span style="color:#388e3c;font-weight:600">${opp.amount ? '¥'+opp.amount+'万' : '-'}</span></div>
        <div class="detail-item"><label>负责人</label><span>${opp.owner}</span></div>
        <div class="detail-item"><label>预计成交日期</label><span>${formatDate(opp.closedate)}</span></div>
      </div>
    </div>
    <div class="detail-section">
      <h4>需求与产品（${(opp.needs||[]).length}项）</h4>
      ${(opp.needs||[]).length === 0 ? '<div style="color:#bbb;font-size:13px">暂无需求记录</div>' :
        `<table style="width:100%;font-size:13px;border-collapse:collapse">
          <tr style="background:#f8f9ff"><th style="padding:8px;text-align:left">需求</th><th style="padding:8px;text-align:left">产品</th><th style="padding:8px;text-align:right">预估金额</th></tr>
          ${opp.needs.map(n => `<tr style="border-top:1px solid #f0f0f0">
            <td style="padding:8px">${n.desc}</td><td style="padding:8px">${n.product||'-'}</td>
            <td style="padding:8px;text-align:right;color:#388e3c">${n.amount ? '¥'+n.amount+'万' : '-'}</td>
          </tr>`).join('')}
        </table>`}
    </div>
    ${opp.note ? `<div class="detail-section"><h4>备注</h4><p style="font-size:13px;color:#555">${opp.note}</p></div>` : ''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap">
      ${opp.stage !== 'won' && opp.stage !== 'lost' ? `<button class="btn btn-primary btn-sm" onclick="moveOppStage('${opp.id}');closeModal('detailModal')"><i class="fas fa-arrow-right"></i> 推进阶段</button>` : ''}
      ${opp.stage === 'won' ? `<button class="btn btn-sm" style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7" onclick="closeModal('detailModal');createContractFromOpp('${opp.id}')"><i class="fas fa-file-contract"></i> 建立合同</button>` : ''}
      <button class="btn btn-outline btn-sm" onclick="editOpp('${opp.id}')"><i class="fas fa-edit"></i> 编辑商机</button>
      ${opp.stage !== 'lost' ? `<button class="btn btn-danger btn-sm" onclick="markOppLost('${opp.id}');closeModal('detailModal')"><i class="fas fa-times"></i> 标记失败</button>` : ''}
      ${opp.stage === 'lost' ? `<button class="btn btn-danger btn-sm" onclick="deleteOpp('${opp.id}');closeModal('detailModal')"><i class="fas fa-trash"></i> 删除商机</button>` : ''}
    </div>`;
  openModal('detailModal');
}

function moveOppStage(id) {
  const stageOrder = ['needs_analysis','demo','proposal','negotiation','won'];
  const opps = DB.get('opportunities');
  const opp = opps.find(o => o.id === id);
  if (!opp) return;
  const idx = stageOrder.indexOf(opp.stage);
  if (idx >= 0 && idx < stageOrder.length - 1) {
    opp.stage = stageOrder[idx + 1];
    DB.set('opportunities', opps);
    addActivity(`商机推进：${opp.name} → ${getStageLabel(opp.stage)}`, 'fas fa-arrow-right');
    showToast(`已推进到：${getStageLabel(opp.stage)}`);
    renderPage('opportunities');
  } else { showToast('已是最终阶段', 'error'); }
}

function markOppLost(id) {
  const opps = DB.get('opportunities');
  const opp = opps.find(o => o.id === id);
  if (opp) { opp.stage = 'lost'; DB.set('opportunities', opps); addActivity(`商机失败：${opp.name}`, 'fas fa-times'); renderPage('opportunities'); }
}

function deleteOpp(id) {
  if (!confirm('确认删除此商机？此操作不可恢复。')) return;
  DB.set('opportunities', DB.get('opportunities').filter(o => o.id !== id));
  showToast('商机已删除');
  renderPage('opportunities');
}

// 商机成交后跳转建立合同
function createContractFromOpp(id) {
  const opp = DB.get('opportunities').find(o => o.id === id);
  if (!opp) return;
  refreshAllSelects();
  // 填充合同客户
  const custSel = document.getElementById('contract-customer');
  if (custSel && opp.customerId) {
    const customers = DB.get('customers');
    custSel.innerHTML = '<option value="">请选择客户</option>' + customers.map(c => `<option value="${c.id}">${c.company}</option>`).join('');
    // 找出纯ID（去掉前缀）
    const rawId = opp.customerId.replace('cust_','').replace('lead_','');
    const custMatch = customers.find(c => c.id === opp.customerId || c.id === rawId);
    if (custMatch) custSel.value = custMatch.id;
  }
  // 预填金额
  const amtEl = document.getElementById('contract-amount');
  if (amtEl && opp.amount) amtEl.value = opp.amount;
  // 预填今日日期
  const dateEl = document.getElementById('contract-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
  // 显示来源商机提示
  const tipDiv = document.getElementById('contractFromOppTip');
  const tipName = document.getElementById('contractFromOppName');
  if (tipDiv) tipDiv.style.display = '';
  if (tipName) tipName.textContent = opp.name;
  // 记录来源商机ID
  const oppIdInput = document.getElementById('contract-opp-id');
  if (oppIdInput) oppIdInput.value = opp.id;
  // 切换到合同页
  openModal('addContractModal');
}

function editOpp(id) {
  const opp = DB.get('opportunities').find(o => o.id === id);
  if (!opp) return;
  closeModal('detailModal');
  refreshAllSelects(); refreshProductSelects(); refreshCustomerSelects();
  setTimeout(() => {
    document.getElementById('opp-name').value = opp.name || '';
    document.getElementById('opp-customer').value = opp.customerId || '';
    document.getElementById('opp-amount').value = opp.amount || '';
    document.getElementById('opp-stage').value = opp.stage || 'needs_analysis';
    document.getElementById('opp-owner').value = opp.owner || '';
    document.getElementById('opp-closedate').value = opp.closedate || '';
    document.getElementById('opp-note').value = opp.note || '';
    // 填充需求项
    const s = getSettings();
    const baseOpts = `<option value="">关联产品/方案</option>` + (s.products||[]).map(p=>`<option>${p}</option>`).join('');
    const needsHtml = (opp.needs||[{desc:'',product:'',amount:''}]).map(n =>
      `<div class="need-item">
        <input type="text" placeholder="需求描述" class="need-desc" value="${n.desc||''}">
        <select class="need-product">${baseOpts}</select>
        <input type="number" placeholder="预估金额(万)" class="need-amount" value="${n.amount||''}">
      </div>`).join('');
    document.getElementById('needsList').innerHTML = needsHtml;
    // 设置产品选中值
    document.querySelectorAll('#needsList .need-item').forEach((item, i) => {
      const sel = item.querySelector('.need-product');
      if (opp.needs && opp.needs[i]) sel.value = opp.needs[i].product || '';
    });
    const saveBtn = document.querySelector('#addOppModal .modal-footer .btn-primary');
    saveBtn.textContent = '保存修改'; saveBtn.onclick = () => updateOpp(id);
    document.querySelector('#addOppModal .modal-header h3').textContent = '编辑商机';
    document.getElementById('addOppModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  }, 100);
}

function updateOpp(id) {
  const name = document.getElementById('opp-name').value.trim();
  if (!name) { showToast('请填写商机名称', 'error'); return; }
  const opps = DB.get('opportunities');
  const opp = opps.find(o => o.id === id);
  if (!opp) return;
  const custVal = document.getElementById('opp-customer').value;
  let customerName = opp.customerName;
  if (custVal) {
    const custId = custVal.replace('cust_','').replace('lead_','');
    const found = [...DB.get('customers'), ...DB.get('leads')].find(c => c.id === custId);
    if (found) customerName = found.company;
  }
  const needs = [];
  document.querySelectorAll('#needsList .need-item').forEach(item => {
    const desc = item.querySelector('.need-desc').value;
    const product = item.querySelector('.need-product').value;
    const amount = item.querySelector('.need-amount').value;
    if (desc) needs.push({ desc, product, amount });
  });
  opp.name = name; opp.customerId = custVal; opp.customerName = customerName;
  opp.amount = document.getElementById('opp-amount').value;
  opp.stage = document.getElementById('opp-stage').value;
  opp.owner = document.getElementById('opp-owner').value;
  opp.closedate = document.getElementById('opp-closedate').value;
  opp.note = document.getElementById('opp-note').value;
  opp.needs = needs;
  DB.set('opportunities', opps);
  addActivity(`编辑商机：${name}`, 'fas fa-edit');
  closeModal('addOppModal');
  const saveBtn = document.querySelector('#addOppModal .modal-footer .btn-primary');
  saveBtn.textContent = '保存商机'; saveBtn.onclick = saveOpportunity;
  document.querySelector('#addOppModal .modal-header h3').textContent = '新增商机';
  ['opp-name','opp-amount','opp-closedate','opp-note'].forEach(i => document.getElementById(i).value = '');
  showToast('商机已更新！'); renderPage('opportunities');
}

// ============ 合同管理 ============
function renderContracts() {
  const contracts = DB.get('contracts');
  const tbody = document.getElementById('contractsTableBody');
  if (contracts.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无合同数据</td></tr>'; return; }
  tbody.innerHTML = contracts.map(c => `<tr>
    <td><strong>${c.no}</strong></td>
    <td>${c.customerName || '-'}</td>
    <td style="color:#388e3c;font-weight:600">¥${c.amount||0}万</td>
    <td>${formatDate(c.date)}</td>
    <td>${getStatusTag(c.status)}</td>
    <td>${c.owner}</td>
    <td>
      <button class="action-btn view" onclick="viewContractDetail('${c.id}')"><i class="fas fa-eye"></i></button>
      <button class="action-btn edit" onclick="editContract('${c.id}')" title="编辑"><i class="fas fa-edit"></i></button>
      <button class="action-btn del" onclick="deleteContract('${c.id}')"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`).join('');
}

function saveContract() {
  const no = document.getElementById('contract-no').value.trim();
  const amount = document.getElementById('contract-amount').value;
  if (!no || !amount) { showToast('请填写合同编号和金额', 'error'); return; }
  const custId = document.getElementById('contract-customer').value;
  const found = DB.get('customers').find(c => c.id === custId);
  const fileName = document.getElementById('contractFile').files[0]?.name || '';
  const fromOppId = document.getElementById('contract-opp-id')?.value || '';
  const contract = {
    id: DB.genId(), no, amount, customerId: custId,
    customerName: found ? found.company : '',
    date: document.getElementById('contract-date').value,
    status: document.getElementById('contract-status').value,
    owner: document.getElementById('contract-owner').value,
    note: document.getElementById('contract-note').value,
    fromOppId,
    invoiceTitle: document.getElementById('contract-invoice-title').value.trim(),
    invoiceTaxNo: document.getElementById('contract-invoice-taxno').value.trim(),
    invoiceBank: document.getElementById('contract-invoice-bank').value.trim(),
    invoiceAccount: document.getElementById('contract-invoice-account').value.trim(),
    invoiceAddress: document.getElementById('contract-invoice-address').value.trim(),
    invoicePhone: document.getElementById('contract-invoice-phone').value.trim(),
    fileName, createdAt: new Date().toISOString()
  };
  const contracts = DB.get('contracts'); contracts.push(contract); DB.set('contracts', contracts);
  addActivity(`上传合同：${no}（¥${amount}万）`, 'fas fa-file-contract');
  closeModal('addContractModal');
  _clearContractModal();
  showToast('合同保存成功！'); renderPage('contracts');
}

function _clearContractModal() {
  ['contract-no','contract-amount','contract-note','contract-invoice-title','contract-invoice-taxno','contract-invoice-bank','contract-invoice-account','contract-invoice-address','contract-invoice-phone'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  const pasteArea = document.getElementById('invoicePasteArea');
  if (pasteArea) pasteArea.value = '';
  const pasteBox = document.getElementById('invoicePasteBox');
  if (pasteBox) pasteBox.style.display = 'none';
  const prevImg = document.getElementById('invoiceImgPreview');
  if (prevImg) { prevImg.src = ''; prevImg.style.display = 'none'; }
  const ocrStatus = document.getElementById('invoiceOcrStatus');
  if (ocrStatus) ocrStatus.textContent = '';
  // 清除来源商机提示
  const tipDiv = document.getElementById('contractFromOppTip');
  if (tipDiv) tipDiv.style.display = 'none';
  const oppIdInput = document.getElementById('contract-opp-id');
  if (oppIdInput) oppIdInput.value = '';
}

function deleteContract(id) {
  if (!confirm('确认删除此合同？')) return;
  DB.set('contracts', DB.get('contracts').filter(c => c.id !== id));
  showToast('已删除'); renderPage('contracts');
}

function editContract(id) {
  const c = DB.get('contracts').find(c => c.id === id);
  if (!c) return;
  // 关闭详情弹窗（如果开着）
  closeModal('detailModal');
  refreshAllSelects();
  // 填充客户下拉
  const custSel = document.getElementById('contract-customer');
  if (custSel) {
    const customers = DB.get('customers');
    custSel.innerHTML = '<option value="">请选择客户</option>' + customers.map(cu => `<option value="${cu.id}">${cu.company}</option>`).join('');
  }
  // 填充负责人下拉
  const ownerSel = document.getElementById('contract-owner');
  if (ownerSel) {
    const s = getSettings();
    ownerSel.innerHTML = (s.owners || []).map(o => `<option value="${o}">${o}</option>`).join('');
  }
  setTimeout(() => {
    document.getElementById('contract-no').value = c.no || '';
    document.getElementById('contract-amount').value = c.amount || '';
    const custEl = document.getElementById('contract-customer');
    if (custEl) custEl.value = c.customerId || '';
    document.getElementById('contract-date').value = c.date || '';
    document.getElementById('contract-status').value = c.status || 'active';
    const ownerEl = document.getElementById('contract-owner');
    if (ownerEl) ownerEl.value = c.owner || '';
    document.getElementById('contract-note').value = c.note || '';
    // 发票信息
    document.getElementById('contract-invoice-title').value = c.invoiceTitle || '';
    document.getElementById('contract-invoice-taxno').value = c.invoiceTaxNo || '';
    document.getElementById('contract-invoice-bank').value = c.invoiceBank || '';
    document.getElementById('contract-invoice-account').value = c.invoiceAccount || '';
    document.getElementById('contract-invoice-address').value = c.invoiceAddress || '';
    document.getElementById('contract-invoice-phone').value = c.invoicePhone || '';
    // 修改按钮
    const saveBtn = document.querySelector('#addContractModal .modal-footer .btn-primary');
    saveBtn.textContent = '保存修改';
    saveBtn.onclick = () => updateContract(id);
    document.querySelector('#addContractModal .modal-header h3').textContent = '编辑合同';
    document.getElementById('addContractModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  }, 100);
}

function updateContract(id) {
  const no = document.getElementById('contract-no').value.trim();
  const amount = document.getElementById('contract-amount').value;
  if (!no || !amount) { showToast('请填写合同编号和金额', 'error'); return; }
  const contracts = DB.get('contracts');
  const c = contracts.find(c => c.id === id);
  if (!c) return;
  const custId = document.getElementById('contract-customer').value;
  const found = DB.get('customers').find(cu => cu.id === custId);
  c.no = no;
  c.amount = amount;
  c.customerId = custId;
  c.customerName = found ? found.company : (c.customerName || '');
  c.date = document.getElementById('contract-date').value;
  c.status = document.getElementById('contract-status').value;
  c.owner = document.getElementById('contract-owner').value;
  c.note = document.getElementById('contract-note').value;
  c.invoiceTitle = document.getElementById('contract-invoice-title').value.trim();
  c.invoiceTaxNo = document.getElementById('contract-invoice-taxno').value.trim();
  c.invoiceBank = document.getElementById('contract-invoice-bank').value.trim();
  c.invoiceAccount = document.getElementById('contract-invoice-account').value.trim();
  c.invoiceAddress = document.getElementById('contract-invoice-address').value.trim();
  c.invoicePhone = document.getElementById('contract-invoice-phone').value.trim();
  DB.set('contracts', contracts);
  addActivity(`编辑合同：${no}`, 'fas fa-edit');
  closeModal('addContractModal');
  // 重置按钮
  const saveBtn = document.querySelector('#addContractModal .modal-footer .btn-primary');
  saveBtn.textContent = '保存合同';
  saveBtn.onclick = saveContract;
  document.querySelector('#addContractModal .modal-header h3').textContent = '上传合同';
  // 清空字段
  ['contract-no','contract-amount','contract-note','contract-invoice-title','contract-invoice-taxno',
   'contract-invoice-bank','contract-invoice-account','contract-invoice-address','contract-invoice-phone'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  showToast('合同已更新！'); renderPage('contracts');
}

function viewContractDetail(id) {
  const c = DB.get('contracts').find(c => c.id === id);
  if (!c) return;
  const hasInvoice = c.invoiceTitle || c.invoiceTaxNo;
  document.getElementById('detailTitle').textContent = `合同详情：${c.no}`;
  document.getElementById('detailContent').innerHTML = `
    <div class="detail-section"><h4>合同信息</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>合同编号</label><span>${c.no}</span></div>
        <div class="detail-item"><label>客户名称</label><span>${c.customerName||'-'}</span></div>
        <div class="detail-item"><label>合同金额</label><span style="color:#388e3c;font-weight:700">¥${c.amount}万</span></div>
        <div class="detail-item"><label>签署日期</label><span>${formatDate(c.date)}</span></div>
        <div class="detail-item"><label>合同状态</label>${getStatusTag(c.status)}</div>
        <div class="detail-item"><label>负责人</label><span>${c.owner}</span></div>
        <div class="detail-item"><label>附件</label><span>${c.fileName||'暂无附件'}</span></div>
        ${c.note ? `<div class="detail-item" style="grid-column:1/-1"><label>备注</label><span>${c.note}</span></div>` : ''}
      </div>
    </div>
    ${hasInvoice ? `<div class="detail-section"><h4><i class="fas fa-file-invoice" style="color:#e65100;margin-right:6px"></i>发票抬头信息</h4>
      <div class="detail-grid">
        ${c.invoiceTitle ? `<div class="detail-item" style="grid-column:1/-1"><label>发票抬头</label><span style="font-weight:600">${c.invoiceTitle}</span></div>` : ''}
        ${c.invoiceTaxNo ? `<div class="detail-item"><label>税号</label><span style="font-family:monospace">${c.invoiceTaxNo}</span></div>` : ''}
        ${c.invoiceBank ? `<div class="detail-item"><label>开户银行</label><span>${c.invoiceBank}</span></div>` : ''}
        ${c.invoiceAccount ? `<div class="detail-item"><label>银行账号</label><span style="font-family:monospace">${c.invoiceAccount}</span></div>` : ''}
        ${c.invoiceAddress ? `<div class="detail-item"><label>注册地址</label><span>${c.invoiceAddress}</span></div>` : ''}
        ${c.invoicePhone ? `<div class="detail-item"><label>注册电话</label><span>${c.invoicePhone}</span></div>` : ''}
      </div>
    </div>` : ''}
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btn btn-outline btn-sm" onclick="editContract('${id}')"><i class="fas fa-edit"></i> 编辑合同</button>
    </div>`;
  openModal('detailModal');
}

// ============ 项目实施 ============
function renderProjects() {
  const projects = DB.get('projects');
  const container = document.getElementById('projectsList');
  if (projects.length === 0) { container.innerHTML = '<div class="empty-state"><i class="fas fa-project-diagram"></i> 暂无项目</div>'; return; }
  container.innerHTML = projects.map(p => {
    const milestones = p.milestones || [];
    const done = milestones.filter(m => m.status === 'done').length;
    const pct = milestones.length > 0 ? Math.round(done / milestones.length * 100) : 0;
    return `<div class="project-card">
      <div class="project-card-header ${p.status||'implementing'}">
        <div class="project-card-title">${p.name}</div>
        <div class="project-card-customer"><i class="fas fa-building"></i> ${p.customerName||'未关联客户'}</div>
      </div>
      <div class="project-card-body">
        <div class="project-progress">
          <div class="progress-label"><span>进度</span><span>${done}/${milestones.length} 里程碑 · ${pct}%</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="milestone-list-mini">
          ${milestones.slice(0,4).map(m => `
            <div class="milestone-mini">
              <i class="fas ${m.status==='done'?'fa-check-circle done':'fa-circle pending'}"></i>
              <span>${m.name}</span>
              <span style="color:#bbb;font-size:11px;margin-left:auto">${formatDate(m.date)}</span>
            </div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
          <span style="font-size:12px;color:#888">${p.owner} · ${formatDate(p.start)}</span>
          <button class="btn btn-outline btn-sm" onclick="viewProjectDetail('${p.id}')">查看详情</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function addMilestone() {
  const div = document.createElement('div');
  div.className = 'milestone-item';
  div.innerHTML = `<input type="text" placeholder="里程碑名称" class="milestone-name">
    <input type="date" class="milestone-date">
    <select class="milestone-status"><option value="pending">待完成</option><option value="done">已完成</option></select>`;
  document.getElementById('milestoneList').appendChild(div);
}

function saveProject() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { showToast('请填写项目名称', 'error'); return; }
  const custId = document.getElementById('proj-customer').value;
  const found = DB.get('customers').find(c => c.id === custId);
  const milestones = [];
  document.querySelectorAll('#milestoneList .milestone-item').forEach(item => {
    const n = item.querySelector('.milestone-name').value;
    if (n) milestones.push({ name:n, date:item.querySelector('.milestone-date').value, status:item.querySelector('.milestone-status').value });
  });
  const project = {
    id: DB.genId(), name, customerId: custId, customerName: found ? found.company : '',
    status: document.getElementById('proj-status').value,
    owner: document.getElementById('proj-owner').value,
    start: document.getElementById('proj-start').value,
    end: document.getElementById('proj-end').value,
    desc: document.getElementById('proj-desc').value,
    milestones, createdAt: new Date().toISOString()
  };
  const projects = DB.get('projects'); projects.push(project); DB.set('projects', projects);
  addActivity(`新建项目：${name}`, 'fas fa-tasks');
  closeModal('addProjectModal');
  showToast('项目创建成功！'); renderPage('projects');
}

function viewProjectDetail(id) {
  const p = DB.get('projects').find(p => p.id === id);
  if (!p) return;
  const milestones = p.milestones || [];
  document.getElementById('detailTitle').textContent = `项目详情：${p.name}`;
  document.getElementById('detailContent').innerHTML = `
    <div class="detail-section"><h4>项目信息</h4>
      <div class="detail-grid">
        <div class="detail-item"><label>项目名称</label><span>${p.name}</span></div>
        <div class="detail-item"><label>关联客户</label><span>${p.customerName||'-'}</span></div>
        <div class="detail-item"><label>状态</label>${getStatusTag(p.status)}</div>
        <div class="detail-item"><label>负责人</label><span>${p.owner}</span></div>
        <div class="detail-item"><label>开始日期</label><span>${formatDate(p.start)}</span></div>
        <div class="detail-item"><label>预计完成</label><span>${formatDate(p.end)}</span></div>
      </div>
    </div>
    <div class="detail-section"><h4>里程碑（${milestones.length}个）</h4>
      ${milestones.length === 0 ? '<div style="color:#bbb;font-size:13px">暂无里程碑</div>' :
        milestones.map((m,i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:${m.status==='done'?'#e8f5e9':'#f8f9ff'};border-radius:6px;margin-bottom:6px">
            <i class="fas ${m.status==='done'?'fa-check-circle':'fa-circle'}" style="color:${m.status==='done'?'#388e3c':'#bbb'}"></i>
            <span style="flex:1;font-size:13px">${m.name}</span>
            <span style="font-size:12px;color:#888">${formatDate(m.date)}</span>
            ${m.status!=='done' ? `<button class="btn btn-sm" style="padding:3px 8px;font-size:11px;background:#e8f5e9;color:#2e7d32;border:none;border-radius:4px;cursor:pointer" onclick="completeMilestone('${p.id}',${i})">完成</button>` : ''}
          </div>`).join('')}
    </div>
    ${p.desc ? `<div class="detail-section"><h4>项目描述</h4><p style="font-size:13px;color:#555">${p.desc}</p></div>` : ''}`;
  openModal('detailModal');
}

function completeMilestone(projId, idx) {
  const projects = DB.get('projects');
  const p = projects.find(p => p.id === projId);
  if (p && p.milestones[idx]) {
    p.milestones[idx].status = 'done';
    DB.set('projects', projects);
    addActivity(`里程碑完成：${p.name} - ${p.milestones[idx].name}`, 'fas fa-check-circle');
    showToast('里程碑已标记完成！');
    closeModal('detailModal');
    renderPage('projects');
  }
}

// ============ 跟进提醒 ============
let followupTab = 'today';
function switchTab(page, tab) {
  followupTab = tab;
  document.querySelectorAll('.followup-tabs .tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', ['today','upcoming','all'][i] === tab);
  });
  renderFollowup();
}

function renderFollowup() {
  const followups = DB.get('followups');
  const today = new Date(); today.setHours(0,0,0,0);
  let filtered;
  if (followupTab === 'today') {
    filtered = followups.filter(f => { if (!f.nextdate) return false; const d = new Date(f.nextdate); d.setHours(0,0,0,0); return d <= today; });
  } else if (followupTab === 'upcoming') {
    filtered = followups.filter(f => { if (!f.nextdate) return false; const d = new Date(f.nextdate); d.setHours(0,0,0,0); const diff = Math.floor((d-today)/86400000); return diff > 0 && diff <= 7; });
  } else {
    filtered = [...followups].reverse();
  }
  const container = document.getElementById('followupList');
  if (filtered.length === 0) { container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i> 该分类暂无记录</div>'; return; }
  const typeIcons = { '电话沟通':'fa-phone', '拜访客户':'fa-handshake', '发送邮件':'fa-envelope', '微信沟通':'fa-weixin', '视频会议':'fa-video' };
  container.innerHTML = filtered.map(f => {
    const diff = daysDiff(f.nextdate);
    let sc = 'upcoming', dt = formatDate(f.nextdate);
    if (diff !== null) {
      if (diff < 0) { sc = 'overdue'; dt = `逾期${Math.abs(diff)}天`; }
      else if (diff === 0) { sc = 'today'; dt = '今天'; }
    }
    const initials = (f.customerName || '?').charAt(0).toUpperCase();
    return `<div class="followup-item ${sc}">
      <div class="followup-avatar">${initials}</div>
      <div class="followup-info">
        <div class="followup-title">${f.customerName || '未知客户'}</div>
        <div class="followup-sub">${f.type} · ${f.owner || ''}</div>
        ${f.content ? `<div class="followup-content">${f.content.substr(0,80)}${f.content.length>80?'...':''}</div>` : ''}
        ${f.goal ? `<div style="font-size:12px;color:#1976d2;margin-top:4px"><i class="fas fa-bullseye"></i> 目标：${f.goal}</div>` : ''}
      </div>
      <div class="followup-right">
        <div class="followup-date ${sc}">${dt}</div>
        <div class="followup-type-icon"><i class="fas ${typeIcons[f.type]||'fa-comment'}"></i></div>
        <button class="btn btn-sm" style="margin-top:8px;font-size:11px;white-space:nowrap" onclick="completeFollowup('${f.id}')">
          <i class="fas fa-check"></i> 完成
        </button>
      </div>
    </div>`;
  }).join('');
}

function quickFollowup(customerName, customerId) {
  refreshCustomerSelects();
  refreshAllSelects();
  setTimeout(() => {
    const el = document.getElementById('followup-customer');
    if (el) el.value = customerId;
    const nd = document.getElementById('followup-nextdate');
    const d = new Date(); d.setDate(d.getDate() + 7);
    if (nd) nd.value = d.toISOString().split('T')[0];
  }, 50);
  openModal('addFollowupModal');
}

function saveFollowup() {
  const customerId = document.getElementById('followup-customer').value;
  const nextdate = document.getElementById('followup-nextdate').value;
  if (!customerId || !nextdate) { showToast('请选择客户并设置下次跟进时间', 'error'); return; }
  const allItems = [...DB.get('customers').map(c => ({id:`cust_${c.id}`, name:c.company})),
                    ...DB.get('leads').map(l => ({id:`lead_${l.id}`, name:l.company}))];
  const found = allItems.find(i => i.id === customerId);
  const followup = {
    id: DB.genId(), customerId,
    customerName: found ? found.name : '未知',
    type: document.getElementById('followup-type').value,
    nextdate, priority: document.getElementById('followup-priority').value,
    content: document.getElementById('followup-content').value,
    goal: document.getElementById('followup-goal').value,
    owner: document.getElementById('currentUserName')?.textContent || '管理员',
    createdAt: new Date().toISOString()
  };
  const followups = DB.get('followups'); followups.push(followup); DB.set('followups', followups);
  addActivity(`新增跟进：${found?.name||''}（${followup.type}）`, 'fas fa-bell');
  closeModal('addFollowupModal');
  ['followup-content','followup-goal'].forEach(id => document.getElementById(id).value = '');
  showToast('跟进记录已保存！');
  renderPage('followup'); renderPage('dashboard');
}

function completeFollowup(id) {
  const followups = DB.get('followups');
  const f = followups.find(f => f.id === id);
  if (!f) return;
  // 弹出更友好的日期选择
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="background:#fff;border-radius:12px;padding:24px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
        <h3 style="margin-bottom:16px;font-size:16px">跟进完成 ✅</h3>
        <p style="font-size:13px;color:#888;margin-bottom:16px">请设置下次跟进时间，或直接关闭提醒</p>
        <input type="date" id="nextFollowDate" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:16px">
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="this.closest('[style*=fixed]').remove()" style="padding:9px 16px;border-radius:8px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer">取消</button>
          <button onclick="closeFollowupReminder('${id}',null);this.closest('[style*=fixed]').remove()" style="padding:9px 16px;border-radius:8px;border:none;background:#e53935;color:#fff;cursor:pointer">关闭提醒</button>
          <button onclick="closeFollowupReminder('${id}',document.getElementById('nextFollowDate').value);this.closest('[style*=fixed]').remove()" style="padding:9px 16px;border-radius:8px;border:none;background:#1a237e;color:#fff;cursor:pointer">保存</button>
        </div>
      </div>
    </div>`;
  const d = new Date(); d.setDate(d.getDate() + 7);
  document.body.appendChild(modal);
  document.getElementById('nextFollowDate').value = d.toISOString().split('T')[0];
}

function closeFollowupReminder(id, newDate) {
  const followups = DB.get('followups');
  const f = followups.find(f => f.id === id);
  if (!f) return;
  if (!newDate) {
    DB.set('followups', followups.filter(f => f.id !== id));
    showToast('跟进提醒已关闭');
  } else {
    f.nextdate = newDate;
    DB.set('followups', followups);
    showToast(`下次跟进已设为 ${newDate}`);
  }
  renderPage('followup'); renderPage('dashboard');
}

// ============ 语音录入 ============
let recognition = null;
let isRecording = false;

function initVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.lang = 'zh-CN';
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;
  return r;
}

function toggleVoice() {
  const btn = document.getElementById('voiceBtn');
  const status = document.getElementById('voiceStatus');
  const textarea = document.getElementById('followup-content');
  if (!btn || !textarea) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('您的浏览器不支持语音识别，建议使用 Safari（iOS）或 Chrome', 'error');
    return;
  }

  if (isRecording) {
    stopVoice();
    return;
  }

  recognition = initVoice();
  if (!recognition) return;

  let finalText = textarea.value;
  let interimText = '';

  recognition.onstart = () => {
    isRecording = true;
    btn.classList.add('recording');
    btn.innerHTML = '<i class="fas fa-stop"></i><span class="voice-btn-text">停止录音</span>';
    status.textContent = '🎙 正在录音，请说话...';
    status.className = 'voice-status recording';
  };

  recognition.onresult = (e) => {
    interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalText += e.results[i][0].transcript;
      } else {
        interimText += e.results[i][0].transcript;
      }
    }
    textarea.value = finalText + interimText;
  };

  recognition.onerror = (e) => {
    let msg = '语音识别出错';
    if (e.error === 'not-allowed') msg = '麦克风权限被拒绝，请在设置中允许';
    else if (e.error === 'no-speech') msg = '未检测到声音，请重试';
    showToast(msg, 'error');
    stopVoice();
  };

  recognition.onend = () => {
    if (isRecording) recognition.start(); // 自动续录
  };

  recognition.start();
}

function stopVoice() {
  if (recognition) {
    try { recognition.stop(); } catch(e) {}
    recognition = null;
  }
  isRecording = false;
  const btn = document.getElementById('voiceBtn');
  const status = document.getElementById('voiceStatus');
  if (btn) {
    btn.classList.remove('recording');
    btn.innerHTML = '<i class="fas fa-microphone"></i><span class="voice-btn-text">语音录入</span>';
  }
  if (status) { status.textContent = ''; status.className = 'voice-status'; }
}

// ============ 客户维护 ============
function renderMaintenance() {
  const plans = DB.get('maintenance');
  const container = document.getElementById('maintenanceList');
  if (plans.length === 0) { container.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i> 暂无维护计划</div>'; return; }
  const freqMap = { weekly:'每周', biweekly:'每两周', monthly:'每月', quarterly:'每季度' };
  container.innerHTML = plans.map(p => {
    const initials = (p.customerName||'?').charAt(0).toUpperCase();
    return `<div class="maintenance-item">
      <div class="maint-icon">${initials}</div>
      <div class="maint-info">
        <div class="maint-name">${p.customerName}</div>
        <div class="maint-sub">${p.type} · 负责人：${p.owner}</div>
        ${p.goal ? `<div style="font-size:12px;color:#555;margin-top:4px">${p.goal}</div>` : ''}
      </div>
      <div class="maint-right">
        <div class="maint-freq">${freqMap[p.frequency]||p.frequency}一次</div>
        <div class="maint-next">下次：${getNextMaintenanceDate(p)}</div>
        <button class="action-btn del" onclick="deleteMaintenance('${p.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

function getNextMaintenanceDate(plan) {
  if (!plan.createdAt) return '-';
  const freqDays = { weekly:7, biweekly:14, monthly:30, quarterly:90 };
  const days = freqDays[plan.frequency] || 30;
  let next = new Date(plan.createdAt);
  const now = new Date();
  while (next <= now) next.setDate(next.getDate() + days);
  return formatDate(next.toISOString().split('T')[0]);
}

function saveMaintenance() {
  const custId = document.getElementById('maint-customer').value;
  if (!custId) { showToast('请选择客户', 'error'); return; }
  const allItems = [...DB.get('customers').map(c => ({id:`cust_${c.id}`, name:c.company})),
                    ...DB.get('leads').map(l => ({id:`lead_${l.id}`, name:l.company}))];
  const found = allItems.find(i => i.id === custId);
  const plan = {
    id: DB.genId(), customerId: custId,
    customerName: found ? found.name : '未知',
    frequency: document.getElementById('maint-frequency').value,
    type: document.getElementById('maint-type').value,
    owner: document.getElementById('maint-owner').value,
    goal: document.getElementById('maint-goal').value,
    createdAt: new Date().toISOString()
  };
  const plans = DB.get('maintenance'); plans.push(plan); DB.set('maintenance', plans);
  addActivity(`制定维护计划：${found?.name}（${plan.frequency}）`, 'fas fa-heart');
  closeModal('addMaintenanceModal');
  document.getElementById('maint-goal').value = '';
  showToast('维护计划已保存！'); renderPage('maintenance');
}

function deleteMaintenance(id) {
  if (!confirm('确认删除此维护计划？')) return;
  DB.set('maintenance', DB.get('maintenance').filter(p => p.id !== id));
  showToast('已删除'); renderPage('maintenance');
}

// ============ 名片录入 ============
function previewCardImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    document.getElementById('cardPreviewImg').src = e.target.result;
    document.getElementById('cardPreview').style.display = 'block';
    document.getElementById('cardUploadArea').style.display = 'none';
    // 使用统一识别入口（优先百度API，降级Tesseract）
    // 名片录入页需要创建临时状态提示
    const statusEl = document.createElement('div');
    statusEl.id = 'cardOcrStatus';
    statusEl.style.cssText = 'font-size:12px;color:#1976d2;margin:8px 20px 0';
    statusEl.textContent = '准备识别...';
    const prevEl = document.getElementById('cardPreview');
    prevEl.parentNode.insertBefore(statusEl, prevEl.nextSibling);

    // 百度OCR结果填充到名片录入页字段
    if (true) {
      statusEl.textContent = '正在百度AI识别...';
      try {
        const result = await baiduOcrBusinessCard(e.target.result);
        if (result) {
          fillFromBaiduOcrForCardPage(result);
          statusEl.textContent = '百度AI识别完成 ✓'; statusEl.style.color = '#388e3c';
          return;
        }
      } catch (err) {
        console.error('百度OCR失败:', err);
        statusEl.textContent = '百度识别失败: ' + err.message + '，降级本地识别...';
        statusEl.style.color = '#f57c00';
      }
    }

    // 降级Tesseract
    statusEl.textContent = '正在本地识别...'; statusEl.style.color = '#f57c00';
    if (window.Tesseract) {
      try {
        const { data: { text } } = await Tesseract.recognize(e.target.result, 'chi_sim+eng', { logger: () => {} });
        if (text && text.trim().length > 10) {
          parseCardTextForCardPage(text);
          statusEl.textContent = '本地识别完成，请核对'; statusEl.style.color = '#f57c00';
        } else { statusEl.textContent = '识别结果为空，请手动填写'; statusEl.style.color = '#e53935'; }
      } catch { statusEl.textContent = '识别失败'; statusEl.style.color = '#e53935'; }
    } else { statusEl.textContent = '请先在系统设置配置百度OCR'; statusEl.style.color = '#e53935'; }
  };
  reader.readAsDataURL(file);
}

// 百度OCR结果填充到名片录入页
function fillFromBaiduOcrForCardPage(result) {
  if (!result || !result.words_result) return;
  function setVal(id, val) { if (!val) return; const el = document.getElementById(id); if (el && !el.value) el.value = val.trim(); }
  // 百度名片返回格式：{ "name": {"words": "张三"}, "company": {"words": "某某公司"}, ... }
  for (const key of Object.keys(result.words_result)) {
    const val = (result.words_result[key].words || '').trim();
    if (!val) continue;
    switch (key) {
      case 'name': setVal('card-name', val); break;
      case 'position': case 'title': setVal('card-title', val); break;
      case 'company': setVal('card-company', val); break;
      case 'mobile': case 'phone': case 'tel': case 'telephone': case 'cell_phone': setVal('card-phone', val); break;
      case 'email': setVal('card-email', val); break;
      case 'address': case 'addr': setVal('card-address', val); break;
    }
  }
}

// Tesseract识别结果填充到名片录入页
function parseCardTextForCardPage(text) {
  if (!text || text.trim().length < 5) return;
  const lines = text.split(/\n|；|;/).map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');
  function setVal(id, val) { if (!val) return; const el = document.getElementById(id); if (el && !el.value) el.value = val.trim(); }

  for (const line of lines) {
    const clean = line.replace(/^[公司名称：:\s]+/, '');
    if ((clean.includes('有限') || clean.includes('集团') || clean.includes('股份') || clean.includes('公司')) && clean.length > 4 && clean.length < 50) {
      setVal('card-company', clean); break;
    }
  }
  for (const line of lines) {
    const clean = line.replace(/^[姓名：:\s]+/, '');
    if (clean.length >= 2 && clean.length <= 6 && !clean.includes('有限') && !clean.includes('公司') && !/^\d{11}$/.test(clean)) {
      setVal('card-name', clean); break;
    }
  }
  const phoneMatch = fullText.match(/1[3-9]\d{9}/);
  if (phoneMatch) setVal('card-phone', phoneMatch[0]);
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) setVal('card-email', emailMatch[0]);
}

function clearCardForm() {
  ['card-name','card-title','card-company','card-phone','card-email','card-address','card-note'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('card-industry').value = '';
  document.getElementById('cardPreview').style.display = 'none';
  document.getElementById('cardUploadArea').style.display = 'block';
  const cam = document.getElementById('cardImageCamera');
  const gal = document.getElementById('cardImageGallery');
  if (cam) cam.value = '';
  if (gal) gal.value = '';
}

function getCardData() {
  return {
    name: document.getElementById('card-name').value.trim(),
    title: document.getElementById('card-title').value.trim(),
    company: document.getElementById('card-company').value.trim(),
    phone: document.getElementById('card-phone').value.trim(),
    email: document.getElementById('card-email').value.trim(),
    industry: document.getElementById('card-industry').value,
    address: document.getElementById('card-address').value.trim(),
    note: document.getElementById('card-note').value.trim()
  };
}

// ============ 新增线索的名片识别 ============
function previewLeadCardImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    const preview = document.getElementById('leadCardPreview');
    const uploadArea = document.getElementById('leadCardUploadArea');
    const previewImg = document.getElementById('leadCardPreviewImg');
    const statusEl = document.getElementById('leadOcrStatus');

    previewImg.src = e.target.result;
    preview.style.display = 'block';
    uploadArea.style.display = 'none';
    statusEl.textContent = '准备识别...';
    statusEl.style.color = '#1976d2';

    // 使用统一识别入口（优先百度API，降级Tesseract）
    await recognizeCard(e.target.result, statusEl, 'lead');
  };
  reader.readAsDataURL(file);
}

function clearLeadCard() {
  document.getElementById('leadCardPreview').style.display = 'none';
  document.getElementById('leadCardUploadArea').style.display = 'block';
  document.getElementById('leadCardPreviewImg').src = '';
  const statusEl = document.getElementById('leadOcrStatus');
  if (statusEl) statusEl.textContent = '';
  const cam = document.getElementById('leadCardCamera');
  const gal = document.getElementById('leadCardGallery');
  if (cam) cam.value = '';
  if (gal) gal.value = '';
}

// 解析名片文字并填充到表单
function parseCardText(text) {
  if (!text || text.trim().length < 5) return;
  const lines = text.split(/\n|；|;/).map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // 辅助：设置字段值（仅当未填写时）
  function setField(id, val) {
    if (!val) return;
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val.trim();
  }

  // 1. 公司名称（包含"有限"/"集团"/"股份"/"公司"的关键词）
  for (const line of lines) {
    const clean = line.replace(/^[公司名称：:\s]+/, '');
    if ((clean.includes('有限') || clean.includes('集团') || clean.includes('股份') || clean.includes('公司')) && clean.length > 4 && clean.length < 50) {
      setField('lead-company', clean);
      break;
    }
  }

  // 2. 联系人姓名（通常是2-4个汉字，且不包含关键词）
  for (const line of lines) {
    const clean = line.replace(/^[姓名：:\s]+/, '');
    // 排除公司名称行和手机号行
    if (clean.length >= 2 && clean.length <= 6 && !clean.includes('有限') && !clean.includes('公司') && !clean.includes('集团') && !clean.includes('股份') && !/^\d{11}$/.test(clean)) {
      setField('lead-contact', clean);
      break;
    }
  }

  // 3. 手机号（11位数字）
  const phoneMatch = fullText.match(/1[3-9]\d{9}/);
  if (phoneMatch) setField('lead-phone', phoneMatch[0]);

  // 4. 职位/头衔
  const positionKeywords = ['经理', '总监', '总裁', '主管', '主任', '部长', '部长', 'VP', 'CEO', 'CFO', 'CTO', 'COO'];
  for (const line of lines) {
    const clean = line.replace(/^[职位：:\s]+/, '');
    for (const keyword of positionKeywords) {
      if (clean.includes(keyword)) {
        const noteEl = document.getElementById('lead-note');
        if (noteEl && !noteEl.value) noteEl.value = `职位：${clean}`;
        break;
      }
    }
  }

  // 5. 邮箱
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    const noteEl = document.getElementById('lead-note');
    if (noteEl) {
      const existingNote = noteEl.value;
      noteEl.value = existingNote ? `${existingNote} | 邮箱：${emailMatch[0]}` : `邮箱：${emailMatch[0]}`;
    }
  }

  // 6. 地址
  for (const line of lines) {
    const clean = line.replace(/^[地址：:\s]+/, '');
    // 包含"市"/"区"/"路"/"街"/"省"且长度较长
    if ((clean.includes('市') || clean.includes('区') || clean.includes('路') || clean.includes('街') || clean.includes('省')) && clean.length > 10 && clean.length < 80) {
      const noteEl = document.getElementById('lead-note');
      if (noteEl) {
        const existingNote = noteEl.value;
        noteEl.value = existingNote ? `${existingNote} | 地址：${clean}` : `地址：${clean}`;
      }
      break;
    }
  }
}

// ============ 百度OCR名片识别（API已内置）============
const BAIDU_OCR_API_KEY = 'iHxVtBdzof5MQYZ8wrqba5lS';
const BAIDU_OCR_SECRET_KEY = 'bzJoeYtfk7FgM0zrdsbnVp1JQVGJuYUq';

// 获取百度OCR访问令牌（带缓存30天）
async function getBaiduOcrToken() {
  const cacheKey = 'crm_baidu_ocr_token';
  const cacheExpireKey = 'crm_baidu_ocr_token_expire';
  const cachedToken = localStorage.getItem(cacheKey);
  const cachedExpire = parseInt(localStorage.getItem(cacheExpireKey) || '0');
  // Token有效期30天，提前1天刷新
  if (cachedToken && cachedExpire > Date.now() + 86400000) return cachedToken;

  const resp = await fetch('https://aip.baidubce.com/oauth/2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&client_id=' + encodeURIComponent(BAIDU_OCR_API_KEY) + '&client_secret=' + encodeURIComponent(BAIDU_OCR_SECRET_KEY)
  });
  const data = await resp.json();
  if (data.access_token) {
    localStorage.setItem(cacheKey, data.access_token);
    localStorage.setItem(cacheExpireKey, String(Date.now() + (data.expires_in || 2592000) * 1000));
    return data.access_token;
  }
  return null;
}

// 调用百度名片识别API
async function baiduOcrBusinessCard(imageBase64) {
  let token;
  try {
    token = await getBaiduOcrToken();
  } catch (e) {
    throw new Error('获取Token失败: ' + e.message);
  }
  if (!token) throw new Error('获取百度Token为空，请检查API Key');

  // 去掉 base64 前缀
  const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  let resp;
  try {
    resp = await fetch('https://aip.baidubce.com/rest/2.0/ocr/v1/business_card?access_token=' + token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'image=' + encodeURIComponent(pureBase64)
    });
  } catch (e) {
    throw new Error('网络请求失败: ' + e.message);
  }

  const data = await resp.json();
  if (data.error_code) {
    throw new Error('百度API错误(' + data.error_code + '): ' + (data.error_msg || '未知错误'));
  }
  if (data.words_result) return data;
  throw new Error('百度API未返回识别结果');
}

// 百度OCR结果填充到表单（通用版，支持指定字段前缀）
function fillFromBaiduOcr(result, prefix) {
  if (!result || !result.words_result) return;
  const fields = result.words_result;

  // 辅助：安全设置字段
  function setVal(id, val) {
    if (!val) return;
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val.trim();
  }

  // 百度名片返回格式：{ "name": {"words": "张三"}, "company": {"words": "某某公司"}, ... }
  // words_result 是对象，key是字段名（英文），value.words是识别结果
  for (const key of Object.keys(fields)) {
    const val = (fields[key].words || '').trim();
    if (!val) continue;

    switch (key) {
      case 'name':
        setVal(prefix + '-contact', val);
        break;
      case 'position':
      case 'title':
        if (prefix === 'lead') {
          const noteEl = document.getElementById(prefix + '-note');
          if (noteEl && !noteEl.value) noteEl.value = '职位：' + val;
        }
        break;
      case 'company':
        setVal(prefix + '-company', val);
        break;
      case 'mobile':
      case 'phone':
      case 'tel':
      case 'telephone':
      case 'cell_phone':
        setVal(prefix + '-phone', val);
        break;
      case 'email':
        if (prefix === 'lead') {
          const noteEl = document.getElementById(prefix + '-note');
          if (noteEl) {
            const existing = noteEl.value;
            noteEl.value = existing ? existing + ' | 邮箱：' + val : '邮箱：' + val;
          }
        } else {
          setVal(prefix + '-email', val);
        }
        break;
      case 'address':
      case 'addr':
        if (prefix === 'lead') {
          const noteEl = document.getElementById(prefix + '-note');
          if (noteEl) {
            const existing = noteEl.value;
            noteEl.value = existing ? existing + ' | 地址：' + val : '地址：' + val;
          }
        } else {
          setVal(prefix + '-address', val);
        }
        break;
    }
  }
}

// 统一的名片识别入口（百度API，降级Tesseract）
async function recognizeCard(imageData, statusEl, prefix) {
  // 优先百度OCR
  if (statusEl) { statusEl.textContent = '正在百度AI识别...'; statusEl.style.color = '#1976d2'; }
  try {
    const result = await baiduOcrBusinessCard(imageData);
    if (result) {
      fillFromBaiduOcr(result, prefix);
      if (statusEl) { statusEl.textContent = '百度AI识别完成 ✓'; statusEl.style.color = '#388e3c'; }
      return;
    }
  } catch (e) {
    console.error('百度OCR失败:', e);
    // 显示百度API的具体错误信息
    if (statusEl) { statusEl.textContent = '百度识别失败: ' + e.message + '，降级本地识别...'; statusEl.style.color = '#f57c00'; }
  }

  // 降级：Tesseract 本地OCR
  if (statusEl) { statusEl.textContent = '正在本地识别...'; statusEl.style.color = '#f57c00'; }
  if (window.Tesseract) {
    try {
      const { data: { text } } = await Tesseract.recognize(imageData, 'chi_sim+eng', { logger: () => {} });
      if (text && text.trim().length > 10) {
        parseCardText(text);
        if (statusEl) { statusEl.textContent = '本地识别完成，请核对信息'; statusEl.style.color = '#f57c00'; }
      } else {
        if (statusEl) { statusEl.textContent = '识别结果为空，请手动填写'; statusEl.style.color = '#e53935'; }
      }
    } catch (e) {
      if (statusEl) { statusEl.textContent = '识别失败，请手动填写'; statusEl.style.color = '#e53935'; }
    }
  } else {
    if (statusEl) { statusEl.textContent = '识别服务不可用'; statusEl.style.color = '#e53935'; }
  }
}

function saveCardAsLead() {
  const data = getCardData();
  if (!data.company || !data.name) { showToast('请至少填写公司名称和姓名', 'error'); return; }
  const lead = {
    id: DB.genId(), company: data.company, contact: data.name,
    phone: data.phone, source: '名片录入', owner: '管理员',
    note: `职位：${data.title||'-'} | 邮箱：${data.email||'-'} | 地址：${data.address||'-'}\n${data.note||''}`,
    status: 'active', createdAt: new Date().toISOString()
  };
  const leads = DB.get('leads'); leads.push(lead); DB.set('leads', leads);
  addActivity(`名片录入线索：${data.company}（${data.name}）`, 'fas fa-id-card');
  clearCardForm();
  showToast(`已保存为线索：${data.company}`);
  navigateTo('leads');
}

function saveCardAsCustomer() {
  const data = getCardData();
  if (!data.company || !data.name || !data.phone) { showToast('请填写公司名称、姓名和手机号', 'error'); return; }
  const customer = {
    id: DB.genId(), company: data.company, contact: data.name,
    phone: data.phone, email: data.email, industry: data.industry || '其他',
    level: 'B', owner: '管理员', address: data.address,
    note: `职位：${data.title||'-'}\n${data.note||''}`,
    createdAt: new Date().toISOString()
  };
  const customers = DB.get('customers'); customers.push(customer); DB.set('customers', customers);
  addActivity(`名片录入客户：${data.company}（${data.name}）`, 'fas fa-id-card');
  clearCardForm();
  showToast(`已保存为客户：${data.company}`);
  navigateTo('customers');
}

// ============ 搜索过滤 ============
function filterList(type) {
  const q = (document.getElementById(type === 'leads' ? 'leadsSearch' : 'customersSearch')?.value || '').toLowerCase();
  const tbodyId = type === 'leads' ? 'leadsTableBody' : 'customersTableBody';
  document.querySelectorAll(`#${tbodyId} tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ============ 数据导入导出 ============
function exportData() {
  const keys = ['leads','customers','opportunities','contracts','projects','followups','maintenance','activities','settings'];
  const data = {};
  keys.forEach(k => data[k] = DB.get(k));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CRM数据备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g,'-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据已导出');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm('导入将覆盖现有数据，确认继续？')) return;
      Object.keys(data).forEach(k => DB.set(k, data[k]));
      showToast('数据导入成功！');
      renderPage('dashboard');
    } catch { showToast('文件格式错误', 'error'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('⚠️ 将清空所有数据，此操作不可恢复，确认吗？')) return;
  ['leads','customers','opportunities','contracts','projects','followups','maintenance','activities'].forEach(k => DB.set(k, []));
  showToast('数据已清空');
  renderPage('dashboard');
}

// ============ 合同文件名显示 + 发票图片识别 ============
document.addEventListener('change', function(e) {
  if (e.target.id === 'contractFile') {
    const f = e.target.files[0];
    const d = document.getElementById('contractFileName');
    if (f && d) d.textContent = '已选择：' + f.name;
  }
  if (e.target.id === 'invoiceImageInput') {
    const file = e.target.files[0];
    if (!file) return;
    const statusEl = document.getElementById('invoiceOcrStatus');
    const pasteBox = document.getElementById('invoicePasteBox');
    if (statusEl) { statusEl.textContent = '图片已上传，正在尝试识别...'; statusEl.style.color = '#1976d2'; }
    const reader = new FileReader();
    reader.onload = function(ev) {
      // 显示预览
      const prevEl = document.getElementById('invoiceImgPreview');
      if (prevEl) { prevEl.src = ev.target.result; prevEl.style.display = 'block'; }
      // 尝试OCR（Tesseract.js）
      if (window.Tesseract) {
        Tesseract.recognize(ev.target.result, 'chi_sim+eng', {
          logger: () => {},
          langPath: 'https://tessdata.projectnaptha.com/4.0.0'
        }).then(({ data: { text } }) => {
          if (text && text.trim().length > 10) {
            parseInvoiceText(text);
            if (statusEl) { statusEl.textContent = '识别完成，请核对并补充信息'; statusEl.style.color = '#388e3c'; }
          } else {
            // 识别内容太少，提示粘贴文字
            if (statusEl) { statusEl.textContent = '图片识别效果不佳，建议粘贴开票资料文字'; statusEl.style.color = '#f57c00'; }
            if (pasteBox) pasteBox.style.display = 'block';
          }
        }).catch(() => {
          if (statusEl) { statusEl.textContent = '识别失败，请粘贴开票资料文字'; statusEl.style.color = '#e53935'; }
          if (pasteBox) pasteBox.style.display = 'block';
        });
      } else {
        // 没有Tesseract，直接显示粘贴框
        if (statusEl) { statusEl.textContent = '请粘贴开票资料文字自动识别 ↓'; statusEl.style.color = '#888'; }
        if (pasteBox) pasteBox.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
});

// 从文本解析发票信息（支持标准增值税发票开票资料格式）
function parseInvoiceText(text) {
  if (!text || text.trim().length < 5) return;
  const lines = text.split(/\n|；|;/).map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');

  // 辅助：设置字段值（仅当未填写时）
  function setField(id, val) {
    if (!val) return;
    const el = document.getElementById(id);
    if (el && !el.value) el.value = val.trim();
  }
  function setFieldForce(id, val) {
    if (!val) return;
    const el = document.getElementById(id);
    if (el) el.value = val.trim();
  }

  // ---- 1. 公司名称（发票抬头） ----
  // 格式1: "公司名称：xx有限公司"
  let m = fullText.match(/公司名称[：:]\s*([^\s，,\n；;]{4,40})/);
  if (m) setFieldForce('contract-invoice-title', m[1]);
  else {
    // 格式2: 包含"有限公司"/"集团"/"股份"的独立行
    for (const line of lines) {
      const clean = line.replace(/^[公司名称：:\s]+/, '');
      if ((clean.includes('有限') || clean.includes('集团') || clean.includes('股份') || clean.includes('公司')) && clean.length > 4 && clean.length < 50) {
        setFieldForce('contract-invoice-title', clean); break;
      }
    }
  }

  // ---- 2. 纳税人识别号 ----
  // 格式: "纳税人识别号：91330304797609680M"
  m = fullText.match(/纳税人识别号[：:]\s*([0-9A-Za-z]{15,20})/);
  if (m) setFieldForce('contract-invoice-taxno', m[1].toUpperCase());
  else {
    // 直接匹配18位统一社会信用代码格式
    m = fullText.match(/\b([0-9A-HJ-NP-Z]{18})\b/);
    if (m) setFieldForce('contract-invoice-taxno', m[1]);
    else {
      m = fullText.match(/[0-9A-Z]{15,20}/);
      if (m) setFieldForce('contract-invoice-taxno', m[0]);
    }
  }

  // ---- 3. 地址 + 电话（常见格式：地址、电话：浙江省...) ----
  // 格式: "地址、电话：浙江省温州市... 0577-12345678"
  m = fullText.match(/地址[、,，]?电话[：:]\s*(.+?)(?=开户|$)/);
  if (m) {
    const addrPhoneStr = m[1].trim();
    // 分离电话（0+区号-数字 或 纯数字7-8位）
    const phoneInStr = addrPhoneStr.match(/(0\d{2,3}[\-\s]?\d{7,8})/);
    if (phoneInStr) {
      setFieldForce('contract-invoice-phone', phoneInStr[1]);
      setFieldForce('contract-invoice-address', addrPhoneStr.replace(phoneInStr[1], '').trim());
    } else {
      setFieldForce('contract-invoice-address', addrPhoneStr);
    }
  } else {
    // 单独匹配地址
    m = fullText.match(/地址[：:]\s*([^\n，,；;]{6,60})/);
    if (m) setFieldForce('contract-invoice-address', m[1]);
    // 单独匹配电话
    m = fullText.match(/电话[：:]\s*(0\d{2,3}[\-\s]?\d{7,8})/);
    if (m) setFieldForce('contract-invoice-phone', m[1]);
    else {
      m = fullText.match(/(0\d{2,3}[\-\s]\d{7,8})/);
      if (m) setFieldForce('contract-invoice-phone', m[1]);
    }
  }

  // ---- 4. 开户银行 + 账号 ----
  // 格式: "开户行及帐号：温州瓯海农村商业银行...梓岙支行 201000019794288"
  m = fullText.match(/开户(?:行及帐号|银行|行)[：:]\s*(.+)/);
  if (m) {
    const bankStr = m[1].trim();
    // 账号：末尾的纯数字串（12位以上）
    const accMatch = bankStr.match(/(\d{12,22})\s*$/);
    if (accMatch) {
      setFieldForce('contract-invoice-account', accMatch[1]);
      setFieldForce('contract-invoice-bank', bankStr.replace(accMatch[1], '').trim());
    } else {
      // 账号可能单独在下一行
      setFieldForce('contract-invoice-bank', bankStr);
      const accLine = fullText.match(/(\d{12,22})/);
      if (accLine) setField('contract-invoice-account', accLine[1]);
    }
  } else {
    // 银行账号单独匹配
    m = fullText.match(/(\d{16,22})/);
    if (m) setFieldForce('contract-invoice-account', m[1]);
    for (const line of lines) {
      if (line.includes('银行') && line.length < 40) {
        setField('contract-invoice-bank', line.replace(/开户行[及帐号：:]+/, '').trim()); break;
      }
    }
  }
}

// 手动粘贴文字识别发票信息
function parseInvoiceFromPaste() {
  const ta = document.getElementById('invoicePasteArea');
  if (!ta || !ta.value.trim()) { showToast('请先粘贴开票资料文字', 'error'); return; }
  // 先清空所有字段再重新填充
  ['contract-invoice-title','contract-invoice-taxno','contract-invoice-phone',
   'contract-invoice-bank','contract-invoice-account','contract-invoice-address'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  parseInvoiceText(ta.value);
  const statusEl = document.getElementById('invoiceOcrStatus');
  if (statusEl) { statusEl.textContent = '解析完成，请核对信息'; statusEl.style.color = '#388e3c'; }
  ta.value = '';
  const pasteBox = document.getElementById('invoicePasteBox');
  if (pasteBox) pasteBox.style.display = 'none';
  showToast('发票信息已自动填充，请核对');
}

// ============ 时间显示 ============
function updateTime() {
  const el = document.getElementById('currentTime');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
  }
}
setInterval(updateTime, 60000);

// ============ 侧边栏控制 ============
document.getElementById('sidebarToggle').addEventListener('click', function() {
  document.getElementById('sidebar').classList.toggle('collapsed');
});
document.getElementById('mobileMenuBtn').addEventListener('click', function() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('active');
});

// ============ 导航绑定（修复移动端需要双击的问题）============
document.querySelectorAll('.nav-item').forEach(item => {
  // 移动端触摸事件
  item.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const page = this.dataset.page;
    if (page) navigateTo(page);
  }, { passive: false });
  // 桌面点击事件
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const page = this.dataset.page;
    if (page) navigateTo(page);
  });
});

// ============ 初始化 ============
function init() {
  updateTime();
  refreshAllSelects();
  navigateTo('dashboard');
  if (DB.get('customers').length === 0 && DB.get('leads').length === 0) {
    initDemoData();
  }
}

// ============ 客户名称模糊搜索 & 重复校验 ============

function searchExistingCustomer(val) {
  const box = document.getElementById('custCompanySuggest');
  if (!box) return;
  if (!val || val.trim().length < 1) { box.style.display = 'none'; box.innerHTML = ''; return; }
  const kw = val.trim();
  const customers = DB.get('customers');
  const leads = DB.get('leads');
  const matchedC = customers.filter(c => c.company.includes(kw));
  const matchedL = leads.filter(l => l.company.includes(kw));
  const localItems = [
    ...matchedC.map(c => ({ label: `<span class="suggest-tag suggest-customer">已有客户</span>${c.company}`, name: c.company, type: 'customer' })),
    ...matchedL.slice(0,3).map(l => ({ label: `<span class="suggest-tag suggest-lead">线索</span>${l.company}`, name: l.company, type: 'lead' }))
  ].slice(0, 6);
  if (localItems.length > 0) {
    box.innerHTML = localItems.map(item => `<div class="suggest-item" onclick="selectExistingCompany('${item.name.replace(/'/g,'&#39;')}', '${item.type}')">${item.label}</div>`).join('');
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
    box.innerHTML = '';
  }
}

function selectExistingCompany(name, type) {
  const box = document.getElementById('custCompanySuggest');
  if (box) box.style.display = 'none';
  if (type === 'customer') {
    showToast(`"${name}" 已是现有客户，如需修改请在客户列表中编辑`, 'error');
    document.getElementById('cust-company').value = '';
  } else if (type === 'lead') {
    document.getElementById('cust-company').value = name;
    showToast(`"${name}" 目前为线索，确认后可保存为客户`, 'info');
  } else {
    // 工商数据：直接填入，允许保存为新客户
    document.getElementById('cust-company').value = name;
    showToast(`已填入：${name}`, 'success');
  }
}

// 点击 modal 其他区域隐藏建议框
document.addEventListener('click', function(e) {
  const box = document.getElementById('custCompanySuggest');
  const input = document.getElementById('cust-company');
  if (box && input && !input.contains(e.target) && !box.contains(e.target)) {
    box.style.display = 'none';
  }
});

// ============ 苹果日历 (.ics) 导出 ============
function openCalendarExport() {
  const followups = DB.get('followups').filter(f => f.nextdate);
  const container = document.getElementById('calendarExportList');
  if (!container) return;
  if (followups.length === 0) {
    container.innerHTML = '<div style="color:#bbb;text-align:center;padding:20px">暂无跟进提醒记录</div>';
  } else {
    // 按日期升序排列
    const sorted = [...followups].sort((a,b) => a.nextdate.localeCompare(b.nextdate));
    container.innerHTML = sorted.map(f => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8f9ff;border-radius:8px;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600;color:#1a237e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.customerName}</div>
          <div style="font-size:12px;color:#888;margin-top:2px">${f.type} · ${f.nextdate}</div>
          ${f.goal ? `<div style="font-size:12px;color:#1976d2;margin-top:2px">目标：${f.goal}</div>` : ''}
        </div>
        <button onclick="exportSingleFollowup('${f.id}')" style="flex-shrink:0;padding:6px 12px;border-radius:6px;border:1px solid #1976d2;color:#1976d2;background:#fff;font-size:12px;cursor:pointer;white-space:nowrap">
          <i class="fas fa-download"></i> 导出
        </button>
      </div>`).join('');
  }
  openModal('exportCalendarModal');
}

function buildIcsContent(events) {
  const pad = n => String(n).padStart(2,'0');
  const toIcsDate = (dateStr) => {
    const d = new Date(dateStr + 'T09:00:00');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T090000`;
  };
  const toIcsDateEnd = (dateStr) => {
    const d = new Date(dateStr + 'T10:00:00');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T100000`;
  };
  const esc = s => (s||'').replace(/,/g,'\\,').replace(/;/g,'\\;').replace(/\n/g,'\\n');
  const stamp = (() => { const n=new Date(); return `${n.getFullYear()}${pad(n.getMonth()+1)}${pad(n.getDate())}T${pad(n.getHours())}${pad(n.getMinutes())}${pad(n.getSeconds())}Z`; })();
  const vevents = events.map(e => [
    'BEGIN:VEVENT',
    `UID:crm-${e.id}@crmsystem`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Asia/Shanghai:${toIcsDate(e.nextdate)}`,
    `DTEND;TZID=Asia/Shanghai:${toIcsDateEnd(e.nextdate)}`,
    `SUMMARY:【跟进提醒】${esc(e.customerName)} - ${esc(e.type)}`,
    `DESCRIPTION:客户：${esc(e.customerName)}\\n方式：${esc(e.type)}${e.goal?'\\n目标：'+esc(e.goal):''}${e.content?'\\n内容：'+esc(e.content):''}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:跟进提醒：${esc(e.customerName)}`,
    'END:VALARM',
    'END:VEVENT'
  ].join('\r\n')).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CRM System//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CRM跟进提醒',
    'X-WR-TIMEZONE:Asia/Shanghai',
    vevents,
    'END:VCALENDAR'
  ].join('\r\n');
}

function downloadIcs(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

function exportSingleFollowup(id) {
  const f = DB.get('followups').find(f => f.id === id);
  if (!f) return;
  downloadIcs(buildIcsContent([f]), `跟进提醒_${f.customerName}_${f.nextdate}.ics`);
  showToast('日历文件已下载，用iPhone打开即可添加到日历');
}

function exportAllFollowupsToCalendar() {
  const followups = DB.get('followups').filter(f => f.nextdate);
  if (followups.length === 0) { showToast('暂无跟进提醒可导出', 'error'); return; }
  downloadIcs(buildIcsContent(followups), `CRM跟进提醒_全部_${new Date().toISOString().split('T')[0]}.ics`);
  showToast(`已导出 ${followups.length} 条跟进提醒到日历文件`);
}

function initDemoData() {
  DB.set('customers', [
    { id:'demo1', company:'华联精密制造有限公司', contact:'李总', phone:'138-0000-1111', email:'li@hualian.com', industry:'制造业', level:'A', owner:'张三', address:'上海市浦东新区', note:'老客户，有二次采购意向', createdAt: new Date().toISOString() },
    { id:'demo2', company:'东方汽车零部件厂', contact:'王经理', phone:'139-0000-2222', email:'', industry:'汽车行业', level:'B', owner:'李四', address:'苏州工业园区', note:'价格敏感', createdAt: new Date().toISOString() }
  ]);
  DB.set('leads', [
    { id:'lead1', company:'中原食品集团', contact:'赵总助', phone:'137-0000-3333', source:'展会获取', owner:'王五', nextfollow: new Date(Date.now()+86400000).toISOString().split('T')[0], note:'展会获取，MES兴趣', status:'active', createdAt: new Date().toISOString() },
    { id:'lead2', company:'蓝天化工股份', contact:'孙副总', phone:'136-0000-4444', source:'老客户推荐', owner:'张三', nextfollow: new Date().toISOString().split('T')[0], note:'华联精密推荐，需求明确', status:'active', createdAt: new Date().toISOString() }
  ]);
  DB.set('opportunities', [
    { id:'opp1', name:'华联精密MES系统升级', customerId:'demo1', customerName:'华联精密制造有限公司', amount:'85', stage:'negotiation', owner:'张三', closedate: new Date(Date.now()+30*86400000).toISOString().split('T')[0], needs:[{desc:'MES生产管理系统', product:'MES系统', amount:'85'}], createdAt: new Date().toISOString() },
    { id:'opp2', name:'东方汽车自动化产线', customerId:'demo2', customerName:'东方汽车零部件厂', amount:'120', stage:'proposal', owner:'李四', closedate: new Date(Date.now()+60*86400000).toISOString().split('T')[0], needs:[{desc:'自动化装配产线', product:'自动化产线', amount:'120'}], createdAt: new Date().toISOString() }
  ]);
  DB.set('contracts', [
    { id:'ct1', no:'HT-2026-001', amount:'52', customerId:'demo1', customerName:'华联精密制造有限公司', date: new Date().toISOString().split('T')[0], status:'active', owner:'张三', note:'', fileName:'', createdAt: new Date().toISOString() }
  ]);
  DB.set('followups', [
    { id:'f1', customerId:'cust_demo1', customerName:'华联精密制造有限公司', type:'电话沟通', nextdate: new Date().toISOString().split('T')[0], priority:'high', content:'与李总确认了系统需求，希望Q2上线', goal:'敲定合同签署时间', owner:'张三', createdAt: new Date().toISOString() },
    { id:'f2', customerId:'lead_lead2', customerName:'蓝天化工股份', type:'拜访客户', nextdate: new Date().toISOString().split('T')[0], priority:'high', content:'初次拜访，SCADA需求强烈', goal:'提交初步方案', owner:'张三', createdAt: new Date().toISOString() }
  ]);
  DB.set('maintenance', [
    { id:'m1', customerId:'cust_demo1', customerName:'华联精密制造有限公司', frequency:'monthly', type:'电话问候', owner:'张三', goal:'了解使用情况，挖掘二次需求', createdAt: new Date().toISOString() }
  ]);
  addActivity('系统初始化，演示数据已加载', 'fas fa-rocket');
}

init();
