// ── 1. 顶部导航栏 & 内容区域同步动态渐变 ──
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

// ── 2. MCP 模块截图 Tabs 切换逻辑 ──
function initMcpTabs() {
  const tabButtons = document.querySelectorAll('.mcp-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (!tabId) return;

      // 切换按钮活跃状态
      const header = btn.closest('.mcp-tabs-header');
      if (header) {
        header.querySelectorAll('.mcp-tab-btn').forEach(b => b.classList.remove('active'));
      }
      btn.classList.add('active');

      // 切换内容面板
      const container = btn.closest('.mcp-tabs-container');
      if (container) {
        container.querySelectorAll('.mcp-tab-pane').forEach(pane => {
          if (pane.id === tabId) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
      }
    });
  });
}

// ── 3. 初始化事件挂载 ──
window.addEventListener('DOMContentLoaded', () => {
  initSyncedGradient();
  initMcpTabs();
});
