export const request = axios.create({
    baseURL: '/api',
    timeout: 10000,
});

// 添加请求拦截器
request.interceptors.request.use(
    (config) => {
        // 添加 token 或其他请求头
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器：统一处理错误，避免控制台报错
request.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // 处理权限不足的情况
        if (error.response && error.response.status === 403) {
            console.warn('权限不足，无法访问资源:', error.response?.url || error.config?.url);
            return Promise.resolve(null); // 返回空值，而不是拒绝Promise
        }
        
        // 处理认证失败（token过期或无效）
        if (error.response && error.response.status === 401) {
            console.error('认证失败，跳转到登录页');
            // 这里可以添加跳转到登录页的逻辑
            // router.push('/login');
            return Promise.reject(error);
        }

        // 对于字典等关键数据，404也需要抛出错误，而对于统计数量类接口可以忽略
        if (error.response && error.response.status === 404) {
            console.warn('API 请求失败，404 错误:', error.response?.url || error.config?.url);
            // 如果是字典相关接口，需要保留错误，否则返回null
            const url = error.response?.url || error.config?.url;
            if(url.includes('/dictionary/')) {
                return Promise.reject(error);
            }
            return Promise.resolve(null); // 返回空值，避免中断流程
        }

        if (error.response && error.response.status === 500) {
            console.warn('API 请求失败，500 错误:', error.response?.url || error.config?.url);
            return Promise.resolve(null); // 返回空值，避免中断流程
        }
        
        return Promise.reject(error);
    }
);