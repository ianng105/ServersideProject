 // 返回逻辑：优先回退历史，否则跳转到备用链接
    const FALLBACK_URL = './welcome'; // 没有历史时跳转地址，按需修改


   

    function oauth(provider){
      const map = {
        google: '/auth/google',
        apple: '/auth/apple',
        facebook: '/auth/facebook'
      };
      // 替换为你的后端路由
      window.location.href = map[provider] || '#';
    }
