
const supabaseUrl = 'https://d76c9d0g91hubrqsibvg.baseapi.memfiredb.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImV4cCI6MzM1MTgyNzM4MCwiaWF0IjoxNzc1MDI3MzgwLCJpc3MiOiJzdXBhYmFzZSJ9.DhR_EqtnmjkOjSRwGdaZP6bRcLcoM0ZaUd6Y3S2LR5Y';

// 从全局 supabase 对象 (由 V1 SDK 提供) 创建客户端
// 并将其存储在一个不会冲突的变量名中
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 将我们创建的客户端实例暴露给全局，以便其他脚本使用
window.supabaseClient = supabaseClient;

console.log("MemFire Cloud client (v1) initialized successfully and attached to window.supabaseClient!");
