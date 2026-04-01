// 检查并初始化 Supabase 客户端
function initSupabase() {
    const supabaseUrl = 'https://d76c9d0g91hubrqsibvg.baseapi.memfiredb.com';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImV4cCI6MzM1MTgyNzM4MCwiaWF0IjoxNzc1MDI3MzgwLCJpc3MiOiJzdXBhYmFzZSJ9.DhR_EqtnmjkOjSRwGdaZP6bRcLcoM0ZaUd6Y3S2LR5Y';

    // 尝试从不同的全局变量获取 (V1 SDK 在不同环境下可能挂载位置不同)
    const supabaseLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);

    if (!supabaseLib) {
        console.error("Supabase SDK 尚未加载！请检查网络连接或 CDN 链接。");
        return null;
    }

    try {
        const client = supabaseLib.createClient(supabaseUrl, supabaseKey);
        console.log("MemFire Cloud client (v1) initialized successfully!");
        return client;
    } catch (err) {
        console.error("Supabase 初始化失败:", err);
        return null;
    }
}

// 立即尝试初始化并挂载到全局
window.supabaseClient = initSupabase();