from flask import Flask 
from flask_security import SQLAlchemyUserDatastore,Security
from application.models import db,User,Role
from config import DevelopmentConfig
from application.resources import api
from application.sec import datastore
import flask_excel as excel  # type: ignore
from application.worker import celery_init_app
from application.tasks import daily_reminder
from application.tasks import monthly_report
from celery import Celery
from celery.schedules import crontab


def create_app():
    app=Flask(__name__)
    app.config.from_object(DevelopmentConfig)
    db.init_app(app) #import this db (SQl Alchemy instance )into the main.py
    api.init_app(app) #import api into main.py

    excel.init_excel(app)

    app.security=Security(app,datastore)
    with app.app_context():
        import application.views 
    return app

app= create_app()
celery_app=celery_init_app(app) 


@celery_app.on_after_configure.connect
def send_email(sender, **kwargs):
    sender.add_periodic_task(
       
        crontab(hour=6, minute=50, day_of_week=3),
        daily_reminder.s('Important'),
    )
    sender.add_periodic_task(
       
        crontab(hour=6, minute=50, day_of_week=3),
        monthly_report.s('Report'),
    )





if __name__=='__main__':
    app.run(debug=True)