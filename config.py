import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "")
    FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "")
    FEISHU_BOT_TOKEN = os.getenv("FEISHU_BOT_TOKEN", "")
    DOUBAO_API_KEY = os.getenv("DOUBAO_API_KEY", "")
    DOUBAO_BASE_URL = os.getenv("DOUBAO_BASE_URL", "")
    DOUBAO_MODEL = os.getenv("DOUBAO_MODEL", "")
    TARGET_CHAT_ID = os.getenv("TARGET_CHAT_ID", "")
    STANDUP_TIME = os.getenv("STANDUP_TIME", "09:00")
    TIMEZONE = os.getenv("TIMEZONE", "Asia/Shanghai")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    TASKLIST_GUID = os.getenv("TASKLIST_GUID", "")
    OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://127.0.0.1:8001/callback")
    APP_TENANT_TOKEN = os.getenv("APP_TENANT_TOKEN", "")

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