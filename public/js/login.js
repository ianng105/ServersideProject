 // 返回逻辑：优先回退历史，否则跳转到备用链接
    const FALLBACK_URL = './welcome.html'; // 没有历史时跳转地址，按需修改

    function goBack(){
      if (document.referrer && window.history.length > 1) {
        history.back();
      } else {
        window.location.href = FALLBACK_URL;
      }
    }

    // 示例：登录/忘记密码/三方登录点击处理（替换为你的真实路由）
    document.getElementById('loginBtn').addEventListener('click', () => {
      // 这里替换成真实表单提交
      alert('在此处理登录提交或跳转');
    });
    document.getElementById('forgot').addEventListener('click', (e) => {
      e.preventDefault();
      // 替换为你的忘记密码页面路径
      alert('跳转到忘记密码页');
    });

    function oauth(provider){
      const map = {
        google: '/auth/google',
        apple: '/auth/apple',
        facebook: '/auth/facebook'
      };
      // 替换为你的后端路由
      window.location.href = map[provider] || '#';
    }
