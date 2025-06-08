/**
 * Personal Health Activity Tracker
 * A privacy-first health monitoring application
 * Author: Personal Health Tracker Team
 * License: MIT
 */

'use strict';

// Application state management
class HealthTracker {
    constructor() {
        this.data = {

            records: [],
            noFapRecords: [], // 新增
            settings: {
                reminderTime: '20:00',
                frequencyReminder: 'none',
                theme: 'default'
            },
            version: '1.0.0'
        };

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeUI();
        this.updateStats();
        this.updateHistory();
        this.updateReminders();
    }

    // Data persistence methods
    saveData() {
        try {
            localStorage.setItem('healthTrackerData', JSON.stringify(this.data));
            console.log('Data saved to localStorage:', this.data);
        } catch (error) {
            console.error('Failed to save data:', error);
            this.showNotification('保存数据失败', 'error');
        }
    }

    loadData() {
        try {
            const saved = localStorage.getItem('healthTrackerData');
            console.log('Loaded raw data from localStorage:', saved);
            if (saved) {
                this.data = JSON.parse(saved);
                console.log('Data loaded from localStorage:', this.data);
            } else {
                console.log('No saved data found, using default');
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showNotification('加载数据失败', 'error');
        }
    }
    // UI Initialization
    setupEventListeners() {
        // Mood slider
        const moodSlider = document.getElementById('mood');
        const moodValue = document.getElementById('moodValue');

        if (moodSlider && moodValue) {
            moodSlider.addEventListener('input', function () {
                moodValue.textContent = this.value;
            });
        }

        // File import
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', () => this.handleFileImport());
        }

        // Form submission
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.addRecord();
            }
        });

        // Theme change
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', () => this.changeTheme());
        }
    }

    initializeUI() {
        // Set current datetime
        const now = new Date();
        const dateTimeInput = document.getElementById('recordDateTime');
        if (dateTimeInput) {
            dateTimeInput.value = this.formatDateTimeLocal(now);
        }

        // Initialize theme
        this.applyTheme(this.data.settings.theme);
    }

    // Utility methods
    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Tab switching
    switchTab(tabName) {
        // Hide all tab contents
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(content => content.classList.remove('active'));

        // Remove active class from all tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));

        // Show selected tab
        const targetTab = document.getElementById(tabName);
        const activeTabButton = event.target;

        if (targetTab && activeTabButton) {
            targetTab.classList.add('active');
            activeTabButton.classList.add('active');

            // Update content based on tab
            this.handleTabSwitch(tabName);
        }
    }

    handleTabSwitch(tabName) {
        switch (tabName) {
            case 'stats':
                setTimeout(() => this.updateCharts(), 100);
                break;
            case 'analysis':
                this.updateAnalysis();
                break;
            case 'reminders':
                this.updateReminders();
                break;
            case 'history':
                this.updateHistory();
                break;
        }
    }

    // Record management
    addRecord() {
        const form = document.getElementById('recordForm');
        const dateTime = document.getElementById('recordDateTime').value;
        const duration = parseInt(document.getElementById('duration').value);
        const mood = parseInt(document.getElementById('mood').value);
        const physicalState = document.getElementById('physicalState').value;
        const notes = document.getElementById('notes').value;

        // Validation
        if (!dateTime || !duration) {
            this.showNotification('请填写必要的信息（日期时间和持续时间）', 'warning');
            return;
        }

        if (duration < 1 || duration > 300) {
            this.showNotification('持续时间应在1-300分钟之间', 'warning');
            return;
        }

        // Create record
        const record = {
            id: this.generateId(),
            dateTime: dateTime,
            duration: duration,
            mood: mood,
            physicalState: physicalState,
            notes: notes.trim(),
            timestamp: new Date().toISOString()
        };

        this.data.records.push(record);
        this.saveData();

        // Reset form
        this.resetForm();

        // Update UI
        this.updateStats();
        this.updateHistory();

        this.showNotification('记录添加成功！', 'success');
    }

    resetForm() {
        document.getElementById('duration').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('mood').value = 5;
        document.getElementById('moodValue').textContent = '5';
        document.getElementById('physicalState').value = 'good';

        // Reset to current time
        document.getElementById('recordDateTime').value = this.formatDateTimeLocal(new Date());
    }

    deleteRecord(id) {
        if (confirm('确定要删除这条记录吗？')) {
            this.data.records = this.data.records.filter(record => record.id !== id);
            this.saveData();
            this.updateStats();
            this.updateHistory();
            this.showNotification('记录已删除', 'success');
        }
    }

    // Statistics calculation
    updateStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let todayCount = 0;
        let weekCount = 0;
        let monthCount = 0;

        this.data.records.forEach(record => {
            const recordDate = new Date(record.dateTime);
            const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());

            if (recordDay.getTime() === today.getTime()) {
                todayCount++;
            }
            if (recordDate >= weekStart) {
                weekCount++;
            }
            if (recordDate >= monthStart) {
                monthCount++;
            }
        });

        // Calculate weekly average
        const weeksSinceStart = this.data.records.length > 0 ?
            Math.max(1, Math.ceil((now - new Date(this.data.records[0].dateTime)) / (7 * 24 * 60 * 60 * 1000))) : 1;
        const avgWeekly = (this.data.records.length / weeksSinceStart).toFixed(1);

        // Update UI
        this.updateElement('todayCount', todayCount);
        this.updateElement('weekCount', weekCount);
        this.updateElement('monthCount', monthCount);
        this.updateElement('avgWeekly', avgWeekly);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Chart methods
    updateCharts() {
        this.updateWeeklyChart();
        this.updateTimeDistribution();
    }

    updateWeeklyChart() {
        const canvas = document.getElementById('weeklyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Get last 7 days data
        const last7Days = this.getLast7DaysData();

        // Draw chart
        this.drawBarChart(ctx, canvas, last7Days);
    }

    getLast7DaysData() {
        const last7Days = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const count = this.data.records.filter(record =>
                record.dateTime.startsWith(dateStr)
            ).length;

            last7Days.push({
                date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
                count: count
            });
        }

        return last7Days;
    }

    drawBarChart(ctx, canvas, data) {
        const maxCount = Math.max(...data.map(d => d.count), 1);
        const chartHeight = canvas.height - 60;
        const chartWidth = canvas.width - 60;
        const barWidth = chartWidth / 7;

        // Set styles
        ctx.fillStyle = '#4facfe';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';

        data.forEach((day, index) => {
            const barHeight = (day.count / maxCount) * chartHeight;
            const x = 30 + index * barWidth + barWidth * 0.2;
            const y = canvas.height - 30 - barHeight;

            // Draw bar
            ctx.fillRect(x, y, barWidth * 0.6, barHeight);

            // Draw labels
            ctx.fillStyle = '#333';
            ctx.fillText(day.date, x + barWidth * 0.3, canvas.height - 10);
            ctx.fillText(day.count.toString(), x + barWidth * 0.3, y - 5);
            ctx.fillStyle = '#4facfe';
        });
    }

    updateTimeDistribution() {
        const timeSlots = {
            '早晨 (6-12)': 0,
            '下午 (12-18)': 0,
            '晚上 (18-24)': 0,
            '深夜 (0-6)': 0
        };

        this.data.records.forEach(record => {
            const hour = new Date(record.dateTime).getHours();
            if (hour >= 6 && hour < 12) timeSlots['早晨 (6-12)']++;
            else if (hour >= 12 && hour < 18) timeSlots['下午 (12-18)']++;
            else if (hour >= 18 && hour < 24) timeSlots['晚上 (18-24)']++;
            else timeSlots['深夜 (0-6)']++;
        });

        const total = Object.values(timeSlots).reduce((a, b) => a + b, 0);
        const container = document.getElementById('timeDistribution');

        if (!container) return;

        container.innerHTML = '';
        Object.entries(timeSlots).forEach(([period, count]) => {
            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;

            const div = document.createElement('div');
            div.style.marginBottom = '15px';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${period}</span>
                    <span>${count}次 (${percentage}%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Analysis methods
    updateAnalysis() {
        const analysis = this.generateHealthAnalysis();
        const container = document.getElementById('healthAnalysis');
        if (container) {
            container.innerHTML = analysis;
        }
    }

    generateHealthAnalysis() {
        const totalRecords = this.data.records.length;
        const last30Days = this.data.records.filter(record =>
            (new Date() - new Date(record.dateTime)) <= 30 * 24 * 60 * 60 * 1000
        );

        const avgMood = last30Days.length > 0 ?
            (last30Days.reduce((sum, record) => sum + record.mood, 0) / last30Days.length).toFixed(1) : 0;

        const avgDuration = last30Days.length > 0 ?
            (last30Days.reduce((sum, record) => sum + record.duration, 0) / last30Days.length).toFixed(1) : 0;

        const monthlyFreq = last30Days.length;
        const weeklyFreq = (monthlyFreq / 4.3).toFixed(1);

        let analysis = `
            <div style="line-height: 1.8;">
                <h4>📊 基础数据概览</h4>
                <p>• 总记录数：<strong>${totalRecords}</strong> 次</p>
                <p>• 近30天频率：<strong>${monthlyFreq}</strong> 次（周平均 ${weeklyFreq} 次）</p>
                <p>• 平均心情评分：<strong>${avgMood}/10</strong></p>
                <p>• 平均持续时间：<strong>${avgDuration}</strong> 分钟</p>
                
                <h4 style="margin-top: 25px;">🏥 健康评估</h4>
        `;

        // Frequency assessment
        if (weeklyFreq < 1) {
            analysis += '<p>• 频率：较低，属于正常范围</p>';
        } else if (weeklyFreq <= 3) {
            analysis += '<p>• 频率：正常，符合健康标准</p>';
        } else if (weeklyFreq <= 7) {
            analysis += '<p>• 频率：稍高，注意适度</p>';
        } else {
            analysis += '<p>• 频率：较高，建议适当减少</p>';
        }

        // Mood assessment
        if (avgMood >= 7) {
            analysis += '<p>• 心理状态：良好，情绪积极</p>';
        } else if (avgMood >= 5) {
            analysis += '<p>• 心理状态：一般，情绪稳定</p>';
        } else {
            analysis += '<p>• 心理状态：需要关注，建议寻求支持</p>';
        }

        analysis += `
                <h4 style="margin-top: 25px;">💡 个性化建议</h4>
                <p>• 保持规律的作息时间</p>
                <p>• 注意个人卫生和清洁</p>
                <p>• 适度运动，保持身心健康</p>
                <p>• 如有任何担忧，及时咨询专业医生</p>
            </div>
        `;

        return analysis;
    }

    // History management
    updateHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        if (this.data.records.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无记录</p>';
            return;
        }

        const sortedRecords = [...this.data.records].sort((a, b) =>
            new Date(b.dateTime) - new Date(a.dateTime)
        );

        historyList.innerHTML = sortedRecords.map(record => this.createHistoryItemHTML(record)).join('');
    }

    createHistoryItemHTML(record) {
        return `
            <div class="history-item">
                <div class="date">${new Date(record.dateTime).toLocaleString('zh-CN')}</div>
                <div>持续时间：${record.duration}分钟 | 心情：${record.mood}/10 | 状态：${this.getStateText(record.physicalState)}</div>
                ${record.notes ? `<div class="note">${record.notes}</div>` : ''}
                <button class="btn btn-danger" style="margin-top: 10px; padding: 5px 10px; font-size: 0.8rem;" 
                        onclick="app.deleteRecord('${record.id}')">删除</button>
            </div>
        `;
    }

    getStateText(state) {
        const states = {
            'excellent': '极佳',
            'good': '良好',
            'normal': '一般',
            'tired': '疲劳',
            'stressed': '压力大'
        };
        return states[state] || state;
    }

    filterHistory() {
        const filterDate = document.getElementById('filterDate').value;
        const historyList = document.getElementById('historyList');

        if (!historyList) return;

        if (!filterDate) {
            this.updateHistory();
            return;
        }

        const filteredRecords = this.data.records.filter(record =>
            record.dateTime.startsWith(filterDate)
        );

        if (filteredRecords.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">该日期无记录</p>';
            return;
        }

        historyList.innerHTML = filteredRecords.map(record => this.createHistoryItemHTML(record)).join('');
    }

    // Reminder methods
    setReminder() {
        const frequencyReminder = document.getElementById('frequencyReminder').value;
        const reminderTime = document.getElementById('reminderTime').value;

        this.data.settings.frequencyReminder = frequencyReminder;
        this.data.settings.reminderTime = reminderTime;

        this.saveData();
        this.updateReminders();
        this.showNotification('提醒设置已保存', 'success');
    }

    updateReminders() {
        const container = document.getElementById('currentReminders');
        if (!container) return;

        const { frequencyReminder, reminderTime } = this.data.settings;

        if (frequencyReminder === 'none') {
            container.innerHTML = '<p>暂无活动提醒</p>';
        } else {
            const frequencyText = {
                'daily': '每日',
                'weekly': '每周',
                'custom': '自定义'
            };

            container.innerHTML = `
                <p>✅ ${frequencyText[frequencyReminder]}健康检查提醒</p>
                <p>⏰ 提醒时间：${reminderTime}</p>
            `;
        }
    }

    // Data management
    exportData() {
        try {
            const dataStr = JSON.stringify(this.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `health_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            this.showNotification('数据导出成功！', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('导出失败', 'error');
        }
    }

    handleFileImport() {
        const fileInput = document.getElementById('importFile');
        const file = fileInput.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (this.validateImportData(importedData)) {
                    this.data = importedData;
                    this.saveData();
                    this.updateStats();
                    this.updateHistory();
                    this.showNotification('数据导入成功！', 'success');
                } else {
                    this.showNotification('文件格式不正确', 'error');
                }
            } catch (error) {
                console.error('Import failed:', error);
                this.showNotification('文件解析失败：' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    }

    validateImportData(data) {
        return data &&
            Array.isArray(data.records) &&
            data.settings &&
            typeof data.settings === 'object';
    }

    clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
            this.data.records = [];
            this.saveData();
            this.updateStats();
            this.updateHistory();
            this.showNotification('所有数据已清除', 'success');
        }
    }

    // Theme management
    changeTheme() {
        const themeSelect = document.getElementById('themeSelect');
        if (!themeSelect) return;

        const theme = themeSelect.value;
        this.data.settings.theme = theme;
        this.saveData();
        this.applyTheme(theme);
        this.showNotification(`已切换到${this.getThemeName(theme)}`, 'success');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = theme;
        }
    }

    getThemeName(theme) {
        const themes = {
            'default': '默认主题',
            'dark': '深色主题',
            'minimal': '简约主题'
        };
        return themes[theme] || '未知主题';
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set color based on type
        const colors = {
            'success': '#4CAF50',
            'error': '#f44336',
            'warning': '#ff9800',
            'info': '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 戒色打卡
    noFapCheckIn() {
        const today = new Date().toISOString().slice(0, 10);
        if (this.data.noFapRecords.includes(today)) {
            this.showNotification('今天已打卡！', 'warning');
            return;
        }
        this.data.noFapRecords.push(today);
        this.saveData();
        this.updateNoFapUI();
        this.showNotification('戒色打卡成功！', 'success');
    }

    // 取消打卡
    noFapCancelCheckIn() {
        const today = new Date().toISOString().slice(0, 10);
        const idx = this.data.noFapRecords.indexOf(today);
        if (idx === -1) {
            this.showNotification('今天尚未打卡，无需取消', 'warning');
            return;
        }
        this.data.noFapRecords.splice(idx, 1);
        this.saveData();
        this.updateNoFapUI();
        this.showNotification('今日打卡已取消', 'success');
    }

    // 计算连续天数
    getNoFapStreak() {
        const records = this.data.noFapRecords.slice().sort();
        if (records.length === 0) return 0;
        let streak = 0;
        let prev = new Date();
        prev.setDate(prev.getDate() + 1); // 明天
        for (let i = records.length - 1; i >= 0; i--) {
            const d = new Date(records[i]);
            prev.setDate(prev.getDate() - 1);
            if (
                d.getFullYear() === prev.getFullYear() &&
                d.getMonth() === prev.getMonth() &&
                d.getDate() === prev.getDate()
            ) {
                streak++;
            } else if (i === records.length - 1 && this.isToday(records[i])) {
                streak = 1;
                prev = d;
            } else {
                break;
            }
        }
        return streak;
    }

    isToday(dateStr) {
        const today = new Date();
        const d = new Date(dateStr);
        return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
        );
    }

    // 更新UI
    updateNoFapUI() {
        const streak = this.getNoFapStreak();
        const streakElem = document.getElementById('nofapStreak');
        const btn = document.getElementById('nofapBtn');
        if (streakElem) streakElem.textContent = streak;
        if (btn) {
            const today = new Date().toISOString().slice(0, 10);
            if (this.data.noFapRecords.includes(today)) {
                btn.disabled = true;
                btn.textContent = '今日已打卡';
            } else {
                btn.disabled = false;
                btn.textContent = '今日打卡';
            }
        }
        // 渲染日历
        this.renderNoFapCalendar();
    }

    renderNoFapCalendar() {
        const calendarElem = document.getElementById('nofapCalendar');
        if (!calendarElem) return;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-based

        // 获取本月第一天和天数
        const firstDay = new Date(year, month, 1).getDay(); // 0=周日
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 生成本月所有日期字符串
        const daysArr = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            daysArr.push(dateStr);
        }

        // 渲染表头
        let html = '<table class="calendar-table"><thead><tr>';
        ['日', '一', '二', '三', '四', '五', '六'].forEach(w => html += `<th>${w}</th>`);
        html += '</tr></thead><tbody><tr>';

        // 填充空白
        for (let i = 0; i < firstDay; i++) html += '<td></td>';

        // 渲染每一天
        daysArr.forEach((dateStr, idx) => {
            const day = parseInt(dateStr.slice(-2));
            const checked = this.data.noFapRecords.includes(dateStr);
            html += `<td style="padding:4px;">
                <div style="
                    width:32px;height:32px;line-height:32px;
                    border-radius:50%;margin:auto;
                    background:${checked ? '#4facfe' : '#eee'};
                    color:${checked ? 'white' : '#888'};
                    font-weight:bold;
                    border:1px solid ${checked ? '#4facfe' : '#ccc'};
                    ">
                    ${day}
                </div>
            </td>`;
            // 换行
            if ((idx + firstDay + 1) % 7 === 0) html += '</tr><tr>';
        });

        html += '</tr></tbody></table>';
        calendarElem.innerHTML = html;
    }
}

// Global functions for HTML onclick handlers
function switchTab(tabName) {
    app.switchTab(tabName);
}

function addRecord() {
    app.addRecord();
}

function setReminder() {
    app.setReminder();
}

function filterHistory() {
    app.filterHistory();
}

function exportData() {
    app.exportData();
}

function importData() {
    app.handleFileImport();
}

function clearAllData() {
    app.clearAllData();
}

function changeTheme() {
    app.changeTheme();
}

// 全局函数
function noFapCheckIn() {
    app.noFapCheckIn();
}

function noFapCancelCheckIn() {
    app.noFapCancelCheckIn();
}

// Initialize application
let app;

document.addEventListener('DOMContentLoaded', function () {
    app = new HealthTracker();
    console.log('Personal Health Tracker initialized');

    if (app && typeof app.updateNoFapUI === 'function') {
        app.updateNoFapUI();
    }
});

// Error handling
window.addEventListener('error', function (e) {
    console.error('Application error:', e.error);
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HealthTracker;
}