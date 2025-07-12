import requests
from config import config
from token_store import get_token, _token_dict
import time
import datetime
import os
import json


def fetch_comments(access_token, task_guid):
    url = f"https://open.feishu.cn/open-apis/task/v2/comments"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"resource_id": task_guid, "resource_type": "task"}
    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code == 200:
        return resp.json().get("data", {}).get("items", [])
    return []

def get_tenant_access_token():
    url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/"
    resp = requests.post(url, json={
        "app_id": config.FEISHU_APP_ID,
        "app_secret": config.FEISHU_APP_SECRET
    })
    return resp.json().get("tenant_access_token")

def get_user_name(tenant_access_token, open_id):
    url = f"https://open.feishu.cn/open-apis/contact/v3/users/{open_id}"
    headers = {"Authorization": f"Bearer {tenant_access_token}"}
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return resp.json().get("data", {}).get("user", {}).get("name", open_id)
    return open_id

def timestamp_to_date(ts):
    return datetime.datetime.fromtimestamp(int(ts)//1000).date()

def group_tasks_by_user_and_date(tasks, openid2token):
    user_day = {}
    for task in tasks:
        print(f"任务: {task.get('summary')}")
        print(f"  描述: {task.get('description', 'API未返回')}")
        # 优先用 assignee 的 open_id 拉评论
        assignees = [m.get("id") for m in task.get("members", []) if m.get("role") == "assignee"]
        comment_token = None
        for aid in assignees:
            if aid in openid2token:
                comment_token = openid2token[aid]
                break
        comments = fetch_comments(comment_token, task["guid"]) if comment_token else []
        print(f"  评论: {[c.get('content', 'API未返回') for c in comments]}")
        members = [m.get("id") for m in task.get("members", []) if m.get("role") in ("assignee", "follower")]
        due_ts = task.get("due", {}).get("timestamp")
        if due_ts:
            day = timestamp_to_date(due_ts)
        else:
            day = None
        task_info = {
            "summary": task.get("summary"),
            "completed": task.get("completed_at") != "0",
            "due": due_ts,
            "desc": task.get("description", "API未返回"),
            "comments": [c.get("content", "API未返回") for c in comments],
            "date": str(day)
        }
        for user_id in set(members):
            user_day.setdefault(user_id, {}).setdefault(str(day), []).append(task_info)
        time.sleep(0.2)
    return user_day

def pretty_grouped_tasks(user_day, tenant_access_token):
    text = ""
    for user, days in user_day.items():
        name = get_user_name(tenant_access_token, user)
        text += f"\n【{name}】\n"
        all_tasks = []
        for day, tasks in days.items():
            all_tasks.extend(tasks)
        if all_tasks:
            text += "所有任务：\n"
            for t in all_tasks:
                status = "✅已完成" if t["completed"] else "❌未完成"
                text += f"- {t['summary']}（{status}，日期:{t['date']}）\n  描述：{t['desc'] or '无'}\n"
                if t["comments"]:
                    text += "  评论：" + " | ".join(t["comments"]) + "\n"
        else:
            text += "无任务\n"
    return text

def summarize_with_doubao(text):
    url = config.DOUBAO_BASE_URL
    headers = {
        "Authorization": f"Bearer {config.DOUBAO_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": config.DOUBAO_MODEL,
        "messages": [
            {"role": "system", "content": "你是一个飞书standup机器人，请根据输入的任务、描述和评论，为每个人生成日报和周报，内容包括：所有任务的进展、描述和评论摘要，输出结构化的日报和周报。"},
            {"role": "user", "content": text}
        ]
    }
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code == 200:
        result = resp.json()
        return result.get("choices", [{}])[0].get("message", {}).get("content", "总结失败")
    else:
        return f"总结失败: {resp.text}"

def send_to_group(access_token, chat_id, summary):
    url = "https://open.feishu.cn/open-apis/message/v4/send/"
    headers = {"Authorization": f"Bearer {access_token}"}
    data = {
        "chat_id": chat_id,
        "msg_type": "text",
        "content": {"text": summary}
    }
    resp = requests.post(url, headers=headers, json=data)
    print("群推送返回：", resp.text)
    return resp.json()

def fetch_tasks(access_token):
    tasklist_guid = config.TASKLIST_GUID
    url = f"https://open.feishu.cn/open-apis/task/v2/tasks"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"tasklist_guid": tasklist_guid, "page_size": 50, "user_id_type": "open_id"}
    resp = requests.get(url, headers=headers, params=params)
    print("API返回：", resp.text)
    if resp.status_code != 200:
        print(f"获取任务失败: {resp.text}")
        return []
    data = resp.json().get("data", {})
    return data.get("items", [])

def main():
    # 自动获取所有已授权的用户
    if not _token_dict and os.path.exists("token.json"):
        with open("token.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            _token_dict.update(data)
    
    open_ids = list(_token_dict.keys())
    if not open_ids:
        print("未找到任何已授权的用户，请先通过 FastAPI 授权！")
        return
    
    print(f"自动获取到 {len(open_ids)} 个已授权用户：{open_ids}")
    all_tasks = []
    openid2token = {oid: get_token(oid) for oid in open_ids if get_token(oid)}
    
    for open_id in open_ids:
        access_token = get_token(open_id)
        if not access_token:
            print(f"未找到 open_id {open_id} 的 user_access_token，跳过")
            continue
        tasks = fetch_tasks(access_token)
        print(f"{open_id} 拉取到任务数: {len(tasks)}")
        for t in tasks:
            print(f"  任务: {t.get('summary')}，负责人: {[m.get('id') for m in t.get('members', []) if m.get('role') == 'assignee']}")
        all_tasks.extend(tasks)
    
    if not all_tasks:
        print("未获取到任何任务，请检查任务清单配置和用户权限")
        return
    
    # 去重（按 guid）
    guid_set = set()
    unique_tasks = []
    for t in all_tasks:
        if t["guid"] not in guid_set:
            unique_tasks.append(t)
            guid_set.add(t["guid"])
    
    tenant_access_token = get_tenant_access_token()
    user_day = group_tasks_by_user_and_date(unique_tasks, openid2token)
    pretty_text = pretty_grouped_tasks(user_day, tenant_access_token)
    print("\n美化输出：\n", pretty_text)
    summary = summarize_with_doubao(pretty_text)
    print("\n豆包总结：\n", summary)
    send_to_group(tenant_access_token, config.TARGET_CHAT_ID, summary)

if __name__ == "__main__":
    main()