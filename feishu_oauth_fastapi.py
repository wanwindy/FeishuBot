from fastapi import FastAPI
from fastapi.responses import RedirectResponse, HTMLResponse
import requests
from config import config
from token_store import save_token, get_token

FEISHU_APP_ID = config.FEISHU_APP_ID
FEISHU_APP_SECRET = config.FEISHU_APP_SECRET
OAUTH_REDIRECT_URI = config.OAUTH_REDIRECT_URI
TASKLIST_GUID = ""

app = FastAPI()

@app.get("/auth")
def auth():
    url = f"https://open.feishu.cn/open-apis/authen/v1/index?app_id={FEISHU_APP_ID}&redirect_uri={OAUTH_REDIRECT_URI}&state=state-test"
    return RedirectResponse(url)

@app.get("/callback")
def callback(code: str):
    url = "https://open.feishu.cn/open-apis/authen/v1/access_token"
    resp = requests.post(url, json={
        "grant_type": "authorization_code",
        "code": code,
        "app_id": FEISHU_APP_ID,
        "app_secret": FEISHU_APP_SECRET
    })
    data = resp.json()
    if "data" in data:
        open_id = data["data"]["open_id"]
        access_token = data["data"]["access_token"]
        refresh_token = data["data"]["refresh_token"]
        save_token(open_id, access_token, refresh_token)
        return HTMLResponse(f"<h2>授权成功！open_id: {open_id}</h2>")
    return HTMLResponse(f"<h2>授权失败！{data}</h2>")

@app.get("/tasks")
def get_tasks(open_id: str):
    access_token = get_token(open_id)
    if not access_token:
        return {"msg": "请先完成授权"}
    url = f"https://open.feishu.cn/open-apis/task/v2/tasklists/{TASKLIST_GUID}/tasks"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"page_size": 50, "user_id_type": "open_id"}
    resp = requests.get(url, headers=headers, params=params)
    return resp.json()