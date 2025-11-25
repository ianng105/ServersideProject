document.addEventListener('DOMContentLoaded', function() {
  const saveBtn = document.querySelector('.btn-primary'); // 假设是主按钮
  
  saveBtn.addEventListener('click', function(e) {
    e.preventDefault(); // 阻止默认提交
    
    // 创建水波纹效果
    createRipple(e);
    
    // 模拟表单提交延迟
    setTimeout(() => {
      // 显示烟花效果
      createFireworks();
      
      // 2秒后实际提交表单
      setTimeout(() => {
        document.querySelector('form.body-form').submit();
      }, 2000);
    }, 600);
  });
  
  // 创建水波纹
  function createRipple(e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');
    
    const x = e.clientX - e.target.getBoundingClientRect().left;
    const y = e.clientY - e.target.getBoundingClientRect().top;
    
    ripple.style.width = ripple.style.height = Math.max(e.target.offsetWidth, e.target.offsetHeight) + 'px';
    ripple.style.left = x - (parseInt(ripple.style.width) / 2) + 'px';
    ripple.style.top = y - (parseInt(ripple.style.height) / 2) + 'px';
    
    document.body.appendChild(ripple);
    
    // 动画结束后移除元素
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
  
  // 创建烟花效果
  function createFireworks() {
    // 创建多个烟花点
    const count = 15;
    for (let i = 0; i < count; i++) {
      const firework = document.createElement('span');
      firework.classList.add('firework');
      
      // 随机位置和大小
      const size = Math.random() * 30 + 10;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.7;
      
      // 随机颜色
      const colors = ['#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      firework.style.width = firework.style.height = size + 'px';
      firework.style.left = x + 'px';
      firework.style.top = y + 'px';
      firework.style.background = color;
      firework.style.animation = `firework ${Math.random() * 0.5 + 0.5}s ease-out`;
      
      document.body.appendChild(firework);
      
      // 动画结束后移除元素
      setTimeout(() => {
        firework.remove();
      }, 1000);
    }
    
    // 显示更新提示
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.padding = '16px 24px';
    notification.style.backgroundColor = 'rgba(0,0,0,0.8)';
    notification.style.color = 'white';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '1002';
    notification.style.fontWeight = 'bold';
    notification.textContent = 'Updated successfully!';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  }
});