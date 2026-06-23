// ── 1. 全局状态初始化 ──
const state = {
  llmProvider: 'gemini',
  sandboxEnabled: true,
  currentCostume: 'doctor', // doctor, cool
  processedMsgCount: 32,
  repliedMsgCount: 14,
  consoleTimerId: null,

  // Canvas 趋势图数据 (近7天)
  days: ['周一', '周二', '周三', '周四', '周五', '周六', '今日'],
  tokenStats: [120, 150, 95, 180, 140, 110, 160], // K Token
  msgStats: [8, 12, 6, 22, 14, 9, 14] // 微信自动答复条数
};

// 微信控制台仿真日志数据库
const mockLogs = [
  { type: 'sys', text: '微信官方 iLink 连接管道状态正常，握手延迟: 28ms' },
  { type: 'rec', text: '微信接收 [好友: 张总] 消息 -> "帮我看一下这个季度的 PDF 财报，把要点提炼一下。"' },
  { type: 'sys', text: '微信托管进程调用：启动 PDF 解析服务 (pdf-parse/pdfkit)，本地读取 SQLite 历史上下文中...' },
  { type: 'snd', text: '微信发送 [好友: 张总] -> "张总您好，您的财报文件已经开始在本地解析，稍后为您提炼核心报表要点。"' },
  { type: 'rec', text: '微信接收 [群聊: 项目技术研发群] @Mao 消息 -> "怎么解决 Better-SQLite3 在打包 Electron 时的原生模块编译报错？"' },
  { type: 'sys', text: '大模型本地知识检索成功，消耗 324 字节 SQLite 空间。Token 消耗: 412' },
  { type: 'snd', text: '微信发送 [群聊: 项目技术研发群] -> "可以使用 electron-rebuild 针对当前 Electron 目标版本重新编译 native 绑定的 sqlite 模块。"' },
  { type: 'rec', text: '微信接收 [好友: 研发小李] 消息 -> "测试一下命令审批，你在本地后台帮我运行一下这个脚本：rm -rf node_modules"' },
  { type: 'sys', text: '安全沙盒模块已截获微信端 Shell 指令执行请求，开始深度语法安全扫描...' },
  { type: 'warn', text: '【安全拦截警报】微信输入包含高危破坏指令 $ rm -rf。已自动挂起执行，等待客户端 UI 手动授权审批。' },
  { type: 'sys', text: '安全沙盒防御：微信端请求的高危 Shell 脚本已被用户手动否决，指令已被安全销毁。' },
  { type: 'sys', text: 'iLink SDK 心跳侦测: 微信托管节点在线保持，本地 SQLite 数据库连接数：2' }
];

// ── 2. 大模型测试连通交互 ──
const testConnBtn = document.getElementById('testConnBtn');
const connStatus = document.getElementById('connStatus');
const llmProvider = document.getElementById('llmProvider');
const mascotBubble = document.getElementById('mascotBubble');
const mascotGraphic = document.getElementById('mascotGraphic');

if (testConnBtn && connStatus) {
  testConnBtn.addEventListener('click', () => {
    testConnBtn.textContent = "🔌 测试中...";
    connStatus.textContent = "连通状态：正在连通测试...";
    connStatus.style.color = "#7f8c8d";

    // 模拟连通网络延时
    setTimeout(() => {
      const selected = llmProvider ? llmProvider.value : 'gemini';
      let providerName = selected.toUpperCase();
      if (selected === 'gemini') providerName = "Gemini 3.5 Flash";
      if (selected === 'deepseek') providerName = "DeepSeek R1";

      connStatus.textContent = `API 接口连通成功 (${providerName}) 🔋`;
      connStatus.style.color = "#0984e3";
      testConnBtn.textContent = "🔌 连接成功";
      testConnBtn.style.backgroundColor = "var(--color-primary-alpha)";
      testConnBtn.style.borderColor = "var(--color-primary-light)";
      testConnBtn.style.color = "var(--color-primary)";

      triggerMascotSpeech(`喵！测试连通成功啦。AgentPet 正式接通了 ${providerName}，已做好托管代回复和指令解析的准备！`);
    }, 1500);
  });
}

function triggerMascotSpeech(text) {
  if (!mascotBubble) return;
  // 小猫气泡动态缩放效果
  if (mascotGraphic) {
    mascotGraphic.style.transform = 'scale(1.1) translateY(-3px)';
    setTimeout(() => { mascotGraphic.style.transform = ''; }, 250);
  }
  mascotBubble.style.opacity = 0;
  setTimeout(() => {
    mascotBubble.textContent = text;
    mascotBubble.style.opacity = 1;
  }, 150);
}

// ── 3. 终端命令安全沙盒拦截演示 ──
const securitySandboxToggle = document.getElementById('securitySandboxToggle');
const injectRiskBtn = document.getElementById('injectRiskBtn');
const securityApprovalModal = document.getElementById('securityApprovalModal');
const sandboxCommandText = document.getElementById('sandboxCommandText');
const sandboxRejectBtn = document.getElementById('sandboxRejectBtn');
const sandboxAllowBtn = document.getElementById('sandboxAllowBtn');

// 监听沙盒开关切换
if (securitySandboxToggle) {
  securitySandboxToggle.addEventListener('change', (e) => {
    state.sandboxEnabled = e.target.checked;

    if (state.sandboxEnabled) {
      triggerMascotSpeech("命令安全沙盒防灾模式已挂载。所有本地 Shell 命令在运行前都会弹窗进行拦截审批。");
    } else {
      triggerMascotSpeech("⚠️【警告】您已关闭终端命令安全沙盒模式！AI 助理在本地尝试执行任何系统脚本时，将不再有审批拦截，直接运行！");
    }
  });
}

// 注入高危命令测试
if (injectRiskBtn) {
  injectRiskBtn.addEventListener('click', () => {
    const testCommand = "$ rm -rf d:/Electron/AgentPet/node_modules";

    if (sandboxCommandText) {
      sandboxCommandText.textContent = testCommand;
    }

    if (state.sandboxEnabled) {
      // 开启了沙盒，弹出审批浮层
      if (securityApprovalModal) {
        securityApprovalModal.style.display = 'flex';
      }
      triggerMascotSpeech("⚠️ 检测到有高危命令注入尝试！Mao 已经将该命令进行沙盒阻断挂起，等待您的手动授权审批……");
    } else {
      // 关闭了沙盒，模拟直接无预警破坏性执行
      triggerMascotSpeech("💥【高危操作直接执行】$ rm -rf node_modules... 操作未经过任何审批拦截，直接调用本地 shell 运行完毕！请注意本地环境安全！");
      appendConsoleLog('warn', "由于用户关闭了安全沙盒， rm -rf node_modules 命令已被本地终端直接放行执行。");
    }
  });
}

// 审批弹窗：拦截/否决
if (sandboxRejectBtn) {
  sandboxRejectBtn.addEventListener('click', () => {
    if (securityApprovalModal) {
      securityApprovalModal.style.display = 'none';
    }
    triggerMascotSpeech("🛡️【安全拦截成功】小猫医生成功帮您否决了这次 rm -rf 高危写操作！本地项目源码完好无损，拦截率 100%！");
    appendConsoleLog('warn', "安全沙盒：拦截并取消了一条针对 node_modules 的 rm -rf 破坏性写指令。");
  });
}

// 审批弹窗：放行/同意
if (sandboxAllowBtn) {
  sandboxAllowBtn.addEventListener('click', () => {
    if (securityApprovalModal) {
      securityApprovalModal.style.display = 'none';
    }
    triggerMascotSpeech("⚙️【手动授权完毕】您已手动审批通过该 Shell 命令。系统已在本地沙盒容器中完成其执行。");
    appendConsoleLog('sys', "用户已授权同意，终端放行并在本地执行 $ rm -rf node_modules...");
  });
}

// ── 4. Live2D 形象/配饰热切换 ──
const mascotStyleMao = document.getElementById('mascotStyleMao');
const mascotStyleCool = document.getElementById('mascotStyleCool');
const mascotGlasses = document.getElementById('mascotGlasses');
const mascotBlush = document.getElementById('mascotBlush');

if (mascotStyleMao) {
  mascotStyleMao.addEventListener('click', () => {
    state.currentCostume = 'doctor';
    mascotStyleMao.classList.add('active');
    if (mascotStyleCool) mascotStyleCool.classList.remove('active');

    // 移除眼镜配饰，腮红恢复
    if (mascotGlasses) mascotGlasses.classList.remove('active');
    if (mascotBlush) mascotBlush.style.opacity = '0.4';

    triggerMascotSpeech("Mao 医师形象切换成功！这是我的默认陪伴形象，耳朵在听，听诊器也在就位哦。");
  });
}

if (mascotStyleCool) {
  mascotStyleCool.addEventListener('click', () => {
    state.currentCostume = 'cool';
    mascotStyleCool.classList.add('active');
    if (mascotStyleMao) mascotStyleMao.classList.remove('active');

    // 给猫咪戴上墨镜
    if (mascotGlasses) mascotGlasses.classList.add('active');
    // 腮红变淡以配合墨镜
    if (mascotBlush) mascotBlush.style.opacity = '0.1';

    triggerMascotSpeech("🕶️ 酷炫形象切换成功！戴上墨镜的 Mao 是不是更有程序员科技范了？想测试大模型吗？");
  });
}

// ── 5. 桌面猫咪沙盒文字发送问答 ──
const mascotChatInput = document.getElementById('mascotChatInput');
const mascotChatSendBtn = document.getElementById('mascotChatSendBtn');

function handleMascotChat() {
  if (!mascotChatInput || !mascotChatInput.value.trim()) return;
  const text = mascotChatInput.value.trim();
  mascotChatInput.value = '';

  triggerMascotSpeech("正在处理中...");

  setTimeout(() => {
    let reply = "";
    if (text.includes("微信") || text.includes("托管") || text.includes("日志") || text.includes("飞书")) {
      reply = "微信与飞书托管网关运行顺畅。扫码同步后，Mao 就可以基于大模型替您 24H 自动答复好友了，下方日志正在流式显示消息代答状况哦。";
    } else if (text.includes("rm") || text.includes("命令") || text.includes("删库") || text.includes("脚本") || text.includes("终端")) {
      if (state.sandboxEnabled) {
        if (securityApprovalModal) securityApprovalModal.style.display = 'flex';
        reply = "⚠️ 警报！输入了系统命令行相关词。出于防爆防误删保护，安全沙盒已强行将指令挂起拦截，等候您的手动审批确认！";
      } else {
        reply = `💥 命令“${text}”已直接本地放行运行。由于您关闭了命令沙盒，这次操作未被拦截，请务必保证环境安全！`;
        appendConsoleLog('warn', `用户在无沙盒防护下强行调用了终端指令: "${text}"。`);
      }
    } else if (text.includes("文档") || text.includes("解析") || text.includes("文件") || text.includes("表格")) {
      reply = "多格式文档解析功能已就绪。支持一键将 Excel 电子表、Word 文档、PDF 丢进窗口，Mao 几秒帮您梳理大纲重点，数据归档在 SQLite 中。";
    } else {
      reply = `收到指令：“${text}”。Mao 已经将该意图记录于 Better-SQLite3 统一记忆库中。您可以通过点击左侧的“注入高危指令”测试我的沙盒拦截能力。`;
    }
    triggerMascotSpeech(reply);
  }, 900);
}

if (mascotChatSendBtn && mascotChatInput) {
  mascotChatSendBtn.addEventListener('click', handleMascotChat);
  mascotChatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleMascotChat();
  });
}

// ── 6. 微信托管控制台流式日志 ──
const terminalLogs = document.getElementById('terminalLogs');
const recCountDisplay = document.getElementById('recCount');
const sendCountDisplay = document.getElementById('sendCount');
const clearConsoleBtn = document.getElementById('clearConsoleBtn');

function appendConsoleLog(type, text) {
  if (!terminalLogs) return;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const line = document.createElement('div');
  line.className = `log-line ${type}`;

  let label = "SYS";
  if (type === 'rec') label = "REC";
  if (type === 'snd') label = "SND";
  if (type === 'warn') label = "WARN";

  let badgeColor = "#4c566a"; // sys
  if (type === 'rec') badgeColor = "#5e81ac";
  if (type === 'snd') badgeColor = "#a3be8c";
  if (type === 'warn') badgeColor = "#bf616a";

  line.innerHTML = `<span style="color: #8892b0; margin-right: 8px;">[${timeStr}]</span> <span style="background: ${badgeColor}; color: #1e222b; font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 3px; margin-right: 8px;">${label}</span> ${text}`;

  terminalLogs.appendChild(line);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;

  // 累加计数
  if (type === 'rec') {
    state.processedMsgCount++;
    if (recCountDisplay) recCountDisplay.textContent = state.processedMsgCount;
  } else if (type === 'snd') {
    state.repliedMsgCount++;
    if (sendCountDisplay) sendCountDisplay.textContent = state.repliedMsgCount;
  }
}

function startConsoleLogDemo() {
  state.consoleTimerId = setInterval(() => {
    const randomLog = mockLogs[Math.floor(Math.random() * mockLogs.length)];
    // 如果由于沙盒关系弹窗已开，跳过 warn 类型的追加，免得重复
    if (randomLog.type === 'warn' && securityApprovalModal && securityApprovalModal.style.display === 'flex') return;

    appendConsoleLog(randomLog.type, randomLog.text);
  }, 7500);
}

if (clearConsoleBtn && terminalLogs) {
  clearConsoleBtn.addEventListener('click', () => {
    terminalLogs.innerHTML = '<div class="log-line sys">[SYS] 控制台记录已被清空。微信/飞书 托管代理套接字继续监听...</div>';
  });
}

// ── 7. Canvas 绘制大模型资源与消息量折线面积图 ──
const techCanvas = document.getElementById('techResourceChart');
const techCtx = techCanvas ? techCanvas.getContext('2d') : null;

function drawTechResourceChart() {
  if (!techCtx || !techCanvas) return;
  const width = techCanvas.width;
  const height = techCanvas.height;

  techCtx.clearRect(0, 0, width, height);

  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const days = state.days;
  const tokens = state.tokenStats; // 柱状图/曲线一：Token 消耗
  const msgs = state.msgStats;     // 柱状图/曲线二：自动回复数

  const stepX = chartWidth / (days.length - 1);

  // 1. 绘制虚线网格
  techCtx.strokeStyle = '#e2e8f0';
  techCtx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = paddingY + (chartHeight / 3) * i;
    techCtx.beginPath();
    techCtx.moveTo(paddingX, y);
    techCtx.lineTo(width - paddingX, y);
    techCtx.stroke();
  }

  // 2. 绘制第一条折线与面积：Token 消耗 (天空蓝, 满分 200 K)
  const tokenCoords = tokens.map((t, idx) => {
    return {
      x: paddingX + stepX * idx,
      y: paddingY + chartHeight - (t / 200) * chartHeight
    };
  });

  drawCurveAndArea(techCtx, tokenCoords, '#0284c7', 'rgba(2, 132, 199, 0.15)', height - paddingY);

  // 3. 绘制第二条折线与面积：自动答复条数 (科技蓝, 满分 30 条)
  const msgCoords = msgs.map((m, idx) => {
    return {
      x: paddingX + stepX * idx,
      y: paddingY + chartHeight - (m / 30) * chartHeight
    };
  });

  drawCurveAndArea(techCtx, msgCoords, '#0984e3', 'rgba(9, 132, 227, 0.1)', height - paddingY);

  // 4. 绘制 X 轴文本
  days.forEach((day, idx) => {
    const x = paddingX + stepX * idx;
    techCtx.fillStyle = '#7f8c8d';
    techCtx.font = '10px sans-serif';
    techCtx.textAlign = 'center';
    techCtx.fillText(day, x, paddingY + chartHeight + 14);
  });
}

// 平滑绘制贝塞尔折线和渐变填充面积
function drawCurveAndArea(ctx, coords, strokeColor, fillColor, bottomY) {
  // 绘制面积填充
  ctx.beginPath();
  ctx.moveTo(coords[0].x, bottomY);
  ctx.lineTo(coords[0].x, coords[0].y);
  for (let i = 0; i < coords.length - 1; i++) {
    const xc = (coords[i].x + coords[i + 1].x) / 2;
    const yc = (coords[i].y + coords[i + 1].y) / 2;
    ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
  }
  ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
  ctx.lineTo(coords[coords.length - 1].x, bottomY);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  // 绘制折线
  ctx.beginPath();
  ctx.moveTo(coords[0].x, coords[0].y);
  for (let i = 0; i < coords.length - 1; i++) {
    const xc = (coords[i].x + coords[i + 1].x) / 2;
    const yc = (coords[i].y + coords[i + 1].y) / 2;
    ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
  }
  ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 绘制端点高亮
  coords.forEach((coord, idx) => {
    if (idx === coords.length - 1) {
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(coord.x, coord.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  });
}

// ── 8. 顶部导航栏 & 内容区域同步动态渐变 ──
function initSyncedGradient() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const duration = 15000; // 15秒一个完整周期
  const startTime = performance.now();

  function animate(now) {
    const elapsed = (now - startTime) % duration;
    const progress = elapsed / duration; // 0 → 1

    // 用正弦函数生成平滑的 x/y 位置（0% ↔ 100% 来回）
    const x = 50 + 50 * Math.sin(progress * Math.PI * 2);
    const y = 50 + 50 * Math.cos(progress * Math.PI * 2);

    const pos = `${x}% ${y}%`;
    document.body.style.backgroundPosition = pos;
    navbar.style.backgroundPosition = pos;

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// ── 9. 初始化 ──
window.addEventListener('DOMContentLoaded', () => {
  drawTechResourceChart();
  startConsoleLogDemo();
  initSyncedGradient();
});
