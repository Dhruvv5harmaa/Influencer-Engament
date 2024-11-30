
from flask_login import current_user
from celery import shared_task
from .models import AdRequest, Campaign, User
import flask_excel as excel # type: ignore
from .mail_service import send_message
from .models import User, Role
from jinja2 import Template





@shared_task(ignore_result=False)
def create_campaign_csv(sponsor_id):
    # Filter campaigns by sponsor_id
    all_campaigns = Campaign.query.filter_by(creator_id=sponsor_id).all()

    # Generate CSV output
    csv_output = excel.make_response_from_query_sets(
        all_campaigns, ["name", "description", "start_date", "end_date", "budget", "visibility", "goals", "niche"], "csv"
    )

    filename = f"sponsor_{sponsor_id}_campaigns.csv"
    with open(filename, 'wb') as f:
        f.write(csv_output.data)

    return filename
    



@shared_task(ignore_result=False)
def create_campaign_csv(sponsor_id):
    # Filter campaigns by sponsor_id
    all_campaigns = Campaign.query.filter_by(creator_id=sponsor_id).all()

    # Generate CSV output
    csv_output = excel.make_response_from_query_sets(
        all_campaigns, ["name", "description", "start_date", "end_date", "budget", "visibility", "goals", "niche"], "csv"
    )

    filename = f"sponsor_{sponsor_id}_campaigns.csv"
    with open(filename, 'wb') as f:
        f.write(csv_output.data)

    return filename
    


# @shared_task(ignore_result=False)
# def daily_reminder(message):
#     return message



   
@shared_task(ignore_result=True)
def daily_reminder(subject):
    # users = User.query.filter(User.roles.any(Role.name == '')).all()
    users = User.query.filter(User.roles.any(Role.name.in_(["influencer"]))).all()

    for user in users:
        pending_requests = AdRequest.query.filter_by(influencer_id=user.id, status='Pending').all()
        # with open('test.html', 'r') as f:
        #     template = Template(f.read())
        #     send_message(user.email, subject,
        #                  template.render(email=user.email))
        if pending_requests:  # This checks if the list is not empty
        # You can send the email only if there are pending requests
            send_message(user.email, subject, "Hey there you have pending request, please visit our platform")
       

   
    return "OK"

# @shared_task(ignore_result=True)
# def monthly_report(subject):
#     # users = User.query.filter(User.roles.any(Role.name == '')).all()
#     users = User.query.filter(User.roles.any(Role.name.in_(["sponsor"]))).all()

   
#     for user in users:
#         # Read and render the HTML template
#         campaigns = Campaign.query.filter(Campaign.creator_id == user.id).all()

#         with open('templates/sponsorReport.html', 'r') as f:
#             template = Template(f.read())
            
#             # Prepare context data to render the template
#             context = {
#                 'email': user.email,  # Use the user's email in the template
#                 'campaigns': campaigns,  # Add campaigns to context
#             }
            
#             # Render the template with the context
#             rendered_body = template.render(context)
            
#             # Send the email with the rendered HTML as the body
#             send_message(user.email, subject, rendered_body)
   
#     return "OK"

@shared_task(ignore_result=True)
def monthly_report(subject):
    # Fetch all sponsors
    users = User.query.filter(User.roles.any(Role.name.in_(["sponsor"]))).all()

    for user in users:
        # Fetch campaigns created by the sponsor
        campaigns = Campaign.query.filter(Campaign.creator_id == user.id).all()

        # Create a list to store campaign data along with the percentage
        campaign_data = []

        # Calculate percentage completion for each campaign
        for campaign in campaigns:
            total_requests = AdRequest.query.filter(AdRequest.campaign_id == campaign.id).count()

            done_ad_requests = AdRequest.query.filter(
                AdRequest.campaign_id == campaign.id,
                AdRequest.delivery == 'Done'
            ).all()

            # You can now use `done_ad_requests` as needed, for example:
            done_requests_count = len(done_ad_requests)  # Count of done requests
            
            # Calculate percentage complete
            if total_requests > 0:
                percentage_complete = (done_requests_count / total_requests) * 100
            else:
                percentage_complete = 0  # No AdRequests, consider it as 0%

            accepted_ad_requests = AdRequest.query.filter(
                AdRequest.campaign_id == campaign.id,
                AdRequest.status == 'Accepted'  # Change condition to filter for 'Accepted'
            ).all()


            # Calculate total payment from accepted requests
            total_spending = sum(ad_request.payment_amount for ad_request in accepted_ad_requests)

            budget_left=campaign.budget-total_spending

            # Append campaign details and percentage to the campaign_data list
            campaign_data.append({
                'name': campaign.name,
                'description': campaign.description,
                'start_date': campaign.start_date,
                'end_date': campaign.end_date,
                'budget': campaign.budget,
                'visibility': campaign.visibility,
                'goals': campaign.goals,
                'niche': campaign.niche,
                'percentage_complete': round(percentage_complete, 2), 
                'budget_left':budget_left,
            })

        # Read and render the HTML template
        with open('templates/sponsorReport.html', 'r') as f:
            template = Template(f.read())
            
            # Prepare context data to render the template
            context = {
                'email': user.email,  # Use the user's email in the template
                'campaigns': campaign_data,  # Use the new campaign data list
            }
            
            # Render the template with the context
            rendered_body = template.render(context)
            
            # Send the email with the rendered HTML as the body
            send_message(user.email, subject, rendered_body)
   
    return "OK"