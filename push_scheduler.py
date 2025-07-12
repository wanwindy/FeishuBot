from apscheduler.schedulers.blocking import BlockingScheduler
import main
import json
import os
from token_store import refresh_user_token, get_refresh_token

def refresh_all_tokens():
    """刷新所有用户的access_token"""
    if os.path.exists("token.json"):
        with open("token.json", "r", encoding="utf-8") as f:
            token_data = json.load(f)
        
        for open_id in token_data.keys():
            refresh_token = get_refresh_token(open_id)
            if refresh_token:
                refresh_user_token(open_id, refresh_token)

def job():
    print("[定时任务] 开始自动推送日报/周报...")
    # 先刷新所有用户的token
    print("[定时任务] 刷新所有用户token...")
    refresh_all_tokens()
    # 执行推送任务
    main.main()

if __name__ == "__main__":
    scheduler = BlockingScheduler()
    scheduler.add_job(job, 'cron', hour=9, minute=0)
    print("定时推送服务已启动，每天9:00自动推送")
    scheduler.start() 