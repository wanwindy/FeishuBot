import json
import os
import requests

TOKEN_FILE = "token.json"
_token_dict = {}

def save_token(open_id, access_token, refresh_token):
    _token_dict[open_id] = {
        'access_token': access_token,
        'refresh_token': refresh_token
    }
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(_token_dict, f, ensure_ascii=False)
    print(f"保存token: open_id={open_id}, access_token={access_token}, refresh_token={refresh_token}")

def get_token(open_id):
    if not _token_dict and os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            _token_dict.update(data)
    info = _token_dict.get(open_id)
    if info:
        return info['access_token']
    return None

def get_refresh_token(open_id):
    if not _token_dict and os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            _token_dict.update(data)
    info = _token_dict.get(open_id)
    if info:
        return info['refresh_token']
    return None

def refresh_user_token(open_id, refresh_token):
    url = "https://open.feishu.cn/open-apis/authen/v1/refresh_access_token"
    resp = requests.post(url, json={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    })
    data = resp.json().get("data", {})
    if "access_token" in data:
        save_token(open_id, data["access_token"], data["refresh_token"])
        print(f"open_id {open_id} access_token 已刷新")
        return data["access_token"]
    print(f"open_id {open_id} access_token 刷新失败: {resp.text}")
    return None