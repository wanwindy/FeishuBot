import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "cli_a8e5d1950df49013")
    FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "coIRHv5anvmE3UnIxAZDVfp6Ij7zDy35")
    FEISHU_BOT_TOKEN = os.getenv("FEISHU_BOT_TOKEN", "")
    DOUBAO_API_KEY = os.getenv("DOUBAO_API_KEY", "ffe0f46f-b3ca-4bf6-b94d-1958b0d0f196")
    DOUBAO_BASE_URL = os.getenv("DOUBAO_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3/chat/completions")
    DOUBAO_MODEL = os.getenv("DOUBAO_MODEL", "doubao-1-5-pro-32k-250115")
    TARGET_CHAT_ID = os.getenv("TARGET_CHAT_ID", "oc_2a6e5a8eaa71358de73b507eb32e1a39")
    STANDUP_TIME = os.getenv("STANDUP_TIME", "09:00")
    TIMEZONE = os.getenv("TIMEZONE", "Asia/Shanghai")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    TASKLIST_GUID = os.getenv("TASKLIST_GUID", "414cc0dd-6bd0-46f8-aca8-972c9e550733")
    OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://127.0.0.1:8001/callback")
    APP_TENANT_TOKEN = os.getenv("APP_TENANT_TOKEN", "t-g1047bhST3U2TGB6NKQ3ZICVTTL3DMMW3GLVMIZH")

    @classmethod
    def validate(cls):
        required_fields = [
            "FEISHU_APP_ID",
            "FEISHU_APP_SECRET",
            "DOUBAO_API_KEY",
            "TARGET_CHAT_ID"
        ]
        missing = [f for f in required_fields if not getattr(cls, f)]
        if missing:
            print(f"缺少必要的配置项: {', '.join(missing)}")
            return False
        return True

config = Config()