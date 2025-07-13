var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// 飞书任务机器人授权页面HTML代码
const AUTH_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>飞书任务机器人 - 用户授权</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #3370ff;
            text-align: center;
            margin-bottom: 30px;
        }
        .auth-button {
            display: block;
            width: 100%;
            padding: 15px;
            background-color: #3370ff;
            color: white;
            text-decoration: none;
            text-align: center;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .auth-button:hover {
            background-color: #2860e1;
        }
        .info {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .status {
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .success {
            background-color: #d1fae5;
            border: 1px solid #a7f3d0;
            color: #065f46;
        }
        .error {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
        }
        .code-input {
            width: 100%;
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            margin: 10px 0;
            font-size: 14px;
        }
        .submit-button {
            background-color: #10b981;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .submit-button:hover {
            background-color: #059669;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 飞书任务自动日报/周报机器人</h1>
        
        <div class="info">
            <h3>📋 授权说明</h3>
            <p>为了获取您的飞书任务数据并生成日报/周报，需要您授权访问以下权限：</p>
            <ul>
                <li>📝 读取任务权限</li>
                <li>💬 读取任务评论权限</li>
                <li>👤 读取用户信息权限</li>
            </ul>
            <p><strong>注意：</strong>您的授权信息将安全存储在Cloudflare KV中，仅用于获取任务数据。</p>
        </div>

        <div id="auth-section">
            <a href="#" id="auth-link" class="auth-button">
                🔐 点击授权飞书账号
            </a>
        </div>

        <div id="code-section" style="display: none;">
            <h3>🔑 输入授权码</h3>
            <p>请在飞书授权页面获取授权码，然后输入下方：</p>
            <input type="text" id="auth-code" class="code-input" placeholder="请输入授权码">
            <button onclick="submitCode()" class="submit-button">提交授权码</button>
        </div>

        <div id="status"></div>
    </div>

    <script>
        // 获取当前域名
        const currentDomain = window.location.origin;
        
        // 飞书OAuth2配置
        const FEISHU_APP_ID = 'your_app_id'; // 需要在部署时替换
        const REDIRECT_URI = \`\${currentDomain}/auth/callback\`;
        
        // 授权链接
        const authUrl = \`https://open.feishu.cn/open-apis/authen/v1/index?app_id=\${FEISHU_APP_ID}&redirect_uri=\${encodeURIComponent(REDIRECT_URI)}\`;
        
        document.getElementById('auth-link').href = authUrl;
        
        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (code) {
            // 有授权码，显示输入框
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('code-section').style.display = 'block';
            document.getElementById('auth-code').value = code;
            submitCode();
        } else if (error) {
            // 授权错误
            showStatus(\`授权失败: \${error}\`, 'error');
        }
        
        function submitCode() {
            const code = document.getElementById('auth-code').value.trim();
            if (!code) {
                showStatus('请输入授权码', 'error');
                return;
            }
            
            showStatus('正在处理授权...', 'info');
            
            // 发送授权码到Worker
            fetch('/auth/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: code })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatus('✅ 授权成功！您的账号已添加到机器人中。', 'success');
                    document.getElementById('code-section').style.display = 'none';
                } else {
                    showStatus(\`❌ 授权失败: \${data.error}\`, 'error');
                }
            })
            .catch(error => {
                showStatus(\`❌ 网络错误: \${error.message}\`, 'error');
            });
        }
        
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
        }
    </script>
</body>
</html>`;

// worker.js
var CONFIG = {
  FEISHU_APP_ID: "cli_a8e5d1950df49013",
  // 从环境变量获取
  FEISHU_APP_SECRET: "coIRHv5anvmE3UnIxAZDVfp6Ij7zDy35",
  // 从环境变量获取
  TASKLIST_GUID: "",
  // 从环境变量获取
  TARGET_CHAT_ID: "",
  // 从环境变量获取
  DOUBAO_API_KEY: "",
  // 从环境变量获取
  DOUBAO_BASE_URL: "https://api.doubao.com/v1/chat/completions",
  DOUBAO_MODEL: "doubao-pro"
};
var TOKEN_STORE = null;

function initConfig(env) {
  CONFIG.FEISHU_APP_ID = env.FEISHU_APP_ID;
  CONFIG.FEISHU_APP_SECRET = env.FEISHU_APP_SECRET;
  CONFIG.TASKLIST_GUID = env.TASKLIST_GUID;
  CONFIG.TARGET_CHAT_ID = env.TARGET_CHAT_ID;
  CONFIG.DOUBAO_API_KEY = env.DOUBAO_API_KEY;
  TOKEN_STORE = env.TOKEN_STORE;
  
  // 配置校验
  if (!CONFIG.FEISHU_APP_ID) {
    console.error("未配置FEISHU_APP_ID，请检查环境变量");
  }
  if (!CONFIG.FEISHU_APP_SECRET) {
    console.error("未配置FEISHU_APP_SECRET，请检查环境变量");
  }
  if (!TOKEN_STORE) {
    console.error("未配置TOKEN_STORE(KV命名空间)，token存储功能将失效");
  }
}
__name(initConfig, "initConfig");

async function handleAuthCallback(code) {
  try {
    const tokenUrl = "https://open.feishu.cn/open-apis/authen/v1/access_token";
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `获取access_token失败: ${response.status} ${errorText}`
      };
    }
    
    const data = await response.json();
    if (data.data?.access_token) {
      const userInfo = await getUserInfo(data.data.access_token);
      const openId = userInfo.open_id;
      await saveToken(openId, data.data.access_token, data.data.refresh_token);
      return {
        success: true,
        open_id: openId,
        name: userInfo.name
      };
    } else {
      return {
        success: false,
        error: data.msg || "获取access_token失败"
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
__name(handleAuthCallback, "handleAuthCallback");

// 修复：使用正确的飞书API获取用户信息
async function getUserInfo(accessToken) {
  const url = "https://open.feishu.cn/open-apis/authen/v1/user_info"; // 修正API端点
  const response = await fetch(url, {
    method: "GET", // 修正请求方法
    headers: {
      "Authorization": `Bearer ${accessToken}`, // 使用access_token进行认证
      "Content-Type": "application/json"
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`获取用户信息失败: ${response.status} ${errorText}`);
    return { open_id: "unknown", name: "未知用户" };
  }
  
  const data = await response.json();
  return {
    open_id: data.data?.open_id || "unknown",
    name: data.data?.name || "未知用户"
  };
}
__name(getUserInfo, "getUserInfo");

async function getTenantAccessToken() {
  const url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      app_id: CONFIG.FEISHU_APP_ID,
      app_secret: CONFIG.FEISHU_APP_SECRET
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`获取tenant_access_token失败: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  return data.tenant_access_token;
}
__name(getTenantAccessToken, "getTenantAccessToken");

async function getUserName(tenantAccessToken, openId) {
  const url = `https://open.feishu.cn/open-apis/contact/v3/users/${openId}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${tenantAccessToken}`
    }
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.data?.user?.name || openId;
  }
  
  console.error(`获取用户名称失败: ${response.status} ${await response.text()}`);
  return openId;
}
__name(getUserName, "getUserName");

async function fetchTasks(accessToken) {
  const url = "https://open.feishu.cn/open-apis/task/v2/tasks";
  const params = new URLSearchParams({
    tasklist_guid: CONFIG.TASKLIST_GUID,
    page_size: "50",
    user_id_type: "open_id"
  });
  
  const response = await fetch(`${url}?${params}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`获取任务列表失败: ${response.status} ${errorText}`);
    return [];
  }
  
  const data = await response.json();
  return data.data?.items || [];
}
__name(fetchTasks, "fetchTasks");

async function fetchComments(accessToken, taskGuid) {
  const url = "https://open.feishu.cn/open-apis/task/v2/comments";
  const params = new URLSearchParams({
    resource_id: taskGuid,
    resource_type: "task"
  });
  
  const response = await fetch(`${url}?${params}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`获取任务评论失败: ${response.status} ${errorText}`);
    return [];
  }
  
  const data = await response.json();
  return data.data?.items || [];
}
__name(fetchComments, "fetchComments");

function timestampToDate(ts) {
  const date = new Date(parseInt(ts));
  return date.toISOString().split("T")[0];
}
__name(timestampToDate, "timestampToDate");

async function groupTasksByUserAndDate(tasks, openIdToToken) {
  const userDay = {};
  
  for (const task of tasks) {
    console.log(`任务: ${task.summary}`);
    console.log(`  描述: ${task.description || "API未返回"}`);
    
    const assignees = task.members?.filter((m) => m.role === "assignee").map((m) => m.id) || [];
    let commentToken = null;
    
    for (const aid of assignees) {
      if (openIdToToken[aid]) {
        commentToken = openIdToToken[aid];
        break;
      }
    }
    
    const comments = commentToken ? await fetchComments(commentToken, task.guid) : [];
    console.log(`  评论: ${comments.map((c) => c.content || "API未返回")}`);
    
    const members = task.members?.filter((m) => ["assignee", "follower"].includes(m.role)).map((m) => m.id) || [];
    const dueTs = task.due?.timestamp;
    const day = dueTs ? timestampToDate(dueTs) : null;
    
    const taskInfo = {
      summary: task.summary,
      completed: task.completed_at !== "0",
      due: dueTs,
      desc: task.description || "API未返回",
      comments: comments.map((c) => c.content || "API未返回"),
      date: day
    };
    
    for (const userId of new Set(members)) {
      if (!userDay[userId]) userDay[userId] = {};
      if (!userDay[userId][day]) userDay[userId][day] = [];
      userDay[userId][day].push(taskInfo);
    }
    
    // 控制API请求频率，避免触发限流
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  
  return userDay;
}
__name(groupTasksByUserAndDate, "groupTasksByUserAndDate");

async function prettyGroupedTasks(userDay, tenantAccessToken) {
  let text = "";
  
  for (const [user, days] of Object.entries(userDay)) {
    const name = await getUserName(tenantAccessToken, user);
    text += `
【${name}】
`;
    
    const allTasks = [];
    for (const tasks of Object.values(days)) {
      allTasks.push(...tasks);
    }
    
    if (allTasks.length > 0) {
      text += "所有任务：\n";
      for (const t of allTasks) {
        const status = t.completed ? "✅已完成" : "❌未完成";
        text += `- ${t.summary}（${status}，日期:${t.date}）
  描述：${t.desc || "无"}
`;
        if (t.comments.length > 0) {
          text += "  评论：" + t.comments.join(" | ") + "\n";
        }
      }
    } else {
      text += "无任务\n";
    }
  }
  
  return text;
}
__name(prettyGroupedTasks, "prettyGroupedTasks");

async function summarizeWithDoubao(text) {
  if (!CONFIG.DOUBAO_API_KEY) {
    return "未配置豆包API密钥，无法生成摘要";
  }
  
  try {
    const response = await fetch(CONFIG.DOUBAO_BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.DOUBAO_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: CONFIG.DOUBAO_MODEL,
        messages: [
          {
            role: "system",
            content: "你是一个飞书standup机器人，请根据输入的任务、描述和评论，为每个人生成日报和周报，内容包括：所有任务的进展、描述和评论摘要，输出结构化的日报和周报。"
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });
    
    if (!response.ok) {
      return `总结失败: ${await response.text()}`;
    }
    
    const result = await response.json();
    return result.choices?.[0]?.message?.content || "总结失败";
  } catch (error) {
    return `总结失败: ${error.message}`;
  }
}
__name(summarizeWithDoubao, "summarizeWithDoubao");

async function sendToGroup(accessToken, chatId, summary) {
  const url = "https://open.feishu.cn/open-apis/message/v4/send/";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      msg_type: "text",
      content: { text: summary }
    })
  });
  
  const result = await response.json();
  console.log("群推送返回：", result);
  
  if (!response.ok || result.code !== 0) {
    throw new Error(`发送消息失败: ${result.msg || await response.text()}`);
  }
  
  return result;
}
__name(sendToGroup, "sendToGroup");

async function refreshUserToken(openId, refreshToken) {
  const url = "https://open.feishu.cn/open-apis/authen/v1/refresh_access_token";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });
  
  const data = await response.json();
  
  if (data.data?.access_token) {
    await saveToken(openId, data.data.access_token, data.data.refresh_token);
    console.log(`open_id ${openId} access_token已刷新`);
    return data.data.access_token;
  }
  
  console.log(`open_id ${openId} access_token刷新失败: ${JSON.stringify(data)}`);
  return null;
}
__name(refreshUserToken, "refreshUserToken");

async function saveToken(openId, accessToken, refreshToken) {
  if (!TOKEN_STORE) {
    console.error("KV存储未配置，无法保存token");
    return;
  }
  
  await TOKEN_STORE.put(openId, JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken
  }));
}
__name(saveToken, "saveToken");

async function getToken(openId) {
  if (!TOKEN_STORE) {
    console.error("KV存储未配置，无法获取token");
    return null;
  }
  
  const tokenData = await TOKEN_STORE.get(openId);
  if (tokenData) {
    const data = JSON.parse(tokenData);
    return data.access_token;
  }
  
  return null;
}
__name(getToken, "getToken");

async function getRefreshToken(openId) {
  if (!TOKEN_STORE) {
    console.error("KV存储未配置，无法获取refresh_token");
    return null;
  }
  
  const tokenData = await TOKEN_STORE.get(openId);
  if (tokenData) {
    const data = JSON.parse(tokenData);
    return data.refresh_token;
  }
  
  return null;
}
__name(getRefreshToken, "getRefreshToken");

async function refreshAllTokens() {
  if (!TOKEN_STORE) {
    console.error("KV存储未配置，无法刷新token");
    return;
  }
  
  const keys = await TOKEN_STORE.list();
  for (const key of keys.keys) {
    const refreshToken = await getRefreshToken(key.name);
    if (refreshToken) {
      await refreshUserToken(key.name, refreshToken);
    }
  }
}
__name(refreshAllTokens, "refreshAllTokens");

async function main() {
  console.log("开始执行飞书任务自动日报/周报推送...");
  console.log("刷新所有用户token...");
  
  try {
    await refreshAllTokens();
  } catch (error) {
    console.error("刷新token失败:", error);
  }
  
  if (!TOKEN_STORE) {
    console.log("未配置KV存储，无法获取用户token");
    return;
  }
  
  const keys = await TOKEN_STORE.list();
  const openIds = keys.keys.map((k) => k.name);
  
  if (openIds.length === 0) {
    console.log("未找到任何已授权的用户");
    return;
  }
  
  console.log(`自动获取到 ${openIds.length} 个已授权用户：${openIds}`);
  
  const allTasks = [];
  const openIdToToken = {};
  
  for (const openId of openIds) {
    try {
      const accessToken = await getToken(openId);
      if (!accessToken) {
        console.log(`未找到 open_id ${openId} 的 user_access_token，跳过`);
        continue;
      }
      
      openIdToToken[openId] = accessToken;
      const tasks = await fetchTasks(accessToken);
      console.log(`${openId} 拉取到任务数: ${tasks.length}`);
      
      for (const t of tasks) {
        const assignees = t.members?.filter((m) => m.role === "assignee").map((m) => m.id) || [];
        console.log(`  任务: ${t.summary}，负责人: ${assignees}`);
      }
      
      allTasks.push(...tasks);
    } catch (error) {
      console.error(`处理用户 ${openId} 的任务时出错:`, error);
    }
  }
  
  if (allTasks.length === 0) {
    console.log("未获取到任何任务，请检查任务清单配置和用户权限");
    return;
  }
  
  // 去重处理
  const guidSet = /* @__PURE__ */ new Set();
  const uniqueTasks = [];
  
  for (const t of allTasks) {
    if (!guidSet.has(t.guid)) {
      uniqueTasks.push(t);
      guidSet.add(t.guid);
    }
  }
  
  try {
    const tenantAccessToken = await getTenantAccessToken();
    const userDay = await groupTasksByUserAndDate(uniqueTasks, openIdToToken);
    const prettyText = await prettyGroupedTasks(userDay, tenantAccessToken);
    
    console.log("\n美化输出：\n", prettyText);
    
    const summary = await summarizeWithDoubao(prettyText);
    console.log("\n豆包总结：\n", summary);
    
    await sendToGroup(tenantAccessToken, CONFIG.TARGET_CHAT_ID, summary);
    console.log("推送完成！");
  } catch (error) {
    console.error("生成或发送报告时出错:", error);
  }
}
__name(main, "main");

var worker_default = {
  async fetch(request, env, ctx) {
    try {
      initConfig(env);
      const url = new URL(request.url);
      
      if (url.pathname === "/auth") {
        // 使用内置的HTML代码，而不是从外部URL获取
        const updatedHtml = AUTH_HTML.replace("your_app_id", CONFIG.FEISHU_APP_ID);
        return new Response(updatedHtml, {
          headers: { "Content-Type": "text/html;charset=utf-8" }
        });
      }
      
      if (url.pathname === "/auth/callback") {
        if (request.method === "POST") {
          const body = await request.json();
          const result = await handleAuthCallback(body.code);
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" }
          });
        } else {
          const code = url.searchParams.get("code");
          if (code) {
            const result = await handleAuthCallback(code);
            if (result.success) {
              return new Response(`
                <html>
                  <head><title>授权成功</title></head>
                  <body>
                    <h1>✅ 授权成功！</h1>
                    <p>用户: ${result.name} (${result.open_id})</p>
                    <p>您的账号已添加到机器人中。</p>
                  </body>
                </html>
              `, {
                headers: { "Content-Type": "text/html;charset=utf-8" }
              });
            } else {
              return new Response(`
                <html>
                  <head><title>授权失败</title></head>
                  <body>
                    <h1>❌ 授权失败</h1>
                    <p>错误: ${result.error}</p>
                  </body>
                </html>
              `, {
                headers: { "Content-Type": "text/html;charset=utf-8" }
              });
            }
          }
        }
      }
      
      if (url.pathname === "/trigger") {
        try {
          await main();
          return new Response("推送成功", { status: 200 });
        } catch (error) {
          console.error("推送失败:", error);
          return new Response(`推送失败: ${error.message}`, { status: 500 });
        }
      }
      
      if (url.pathname === "/health") {
        return new Response("OK", { status: 200 });
      }
      
      return new Response("飞书任务自动日报/周报机器人", { status: 200 });
    } catch (error) {
      console.error("处理请求时出错:", error);
      return new Response(`服务器内部错误: ${error.message}`, { status: 500 });
    }
  },
  
  // 定时触发器（需要配置Cron触发器）
  async scheduled(event, env, ctx) {
    initConfig(env);
    try {
      await main();
      console.log("定时推送完成");
    } catch (error) {
      console.error("定时推送失败:", error);
    }
  }
};

export {
  worker_default as default
};