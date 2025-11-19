  // 简单校验：勾选条款、邮箱合法、密码长度
    const form = document.getElementById('form');
    const nextBtn = document.getElementById('nextBtn');
    const email = document.getElementById('email');
    const pwd = document.getElementById('password');
    const tos = document.getElementById('tos');

    function valid() {
      return form.checkValidity() && pwd.value.length >= 10 && tos.checked;
    }

    function updateBtn(){
      nextBtn.disabled = !valid();
    }

    email.addEventListener('input', updateBtn);
    pwd.addEventListener('input', updateBtn);
    tos.addEventListener('change', updateBtn);
    updateBtn();

    nextBtn.addEventListener('click', () => {
      if (!valid()) {
        form.reportValidity();
        return;
      }
      // 提交到后端或跳转到下一步页面
      // form.submit(); // 如果需要真正提交
      // 演示：跳转下一步
      window.location.href = '/bodyinfo';
    });