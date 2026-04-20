workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
bind = "127.0.0.1:8001"
timeout = 30
accesslog = "/var/log/gunicorn/dromiss-access.log"
errorlog = "/var/log/gunicorn/dromiss-error.log"
loglevel = "warning"
