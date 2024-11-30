from datetime import datetime
import os
import uuid
from flask import current_app as app,jsonify, request,render_template,send_file
from flask_login import current_user
from flask_security import auth_required, roles_required
from werkzeug.security import check_password_hash
from .models import AdRequest, Campaign, RolesUsers, User,db,StudyResource,Role
from flask_restful import marshal,fields
from werkzeug.security import generate_password_hash
from .sec import datastore
from .tasks import create_campaign_csv
import flask_excel as excel   # type: ignore
from celery.result import AsyncResult


@app.get('/')
def home():
    return render_template("index.html")





@app.route('/sponsor-signup', methods=['POST'])
def sponsor_signup():
    print("hii")
    data = request.json
    print(data)
    # hashed_password = generate_password_hash(data['password'], method='sha256')
    
    hashed_password = generate_password_hash(data['password'])
    # Create the new user object
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        fs_uniquifier=str(uuid.uuid4()),  # Add this to generate a unique identifier
        industry=data['industry'],
        active=False,
    )
    
    # Save to database
    db.session.add(new_user)
    db.session.commit()
    
    # Assign 'sponsor' role to the user
    sponsor_role = Role.query.filter_by(name='sponsor').first()
    if sponsor_role:
        role_link = RolesUsers(user_id=new_user.id, role_id=sponsor_role.id)
        db.session.add(role_link)
        db.session.commit()

    return jsonify({"message": "User created successfully", "role": "sponsor"}), 201




@app.route('/influencer-signup', methods=['POST'])
def influencer_signup():
    print("Influencer Signup Request Received")
    data = request.json
    print(data)

    # Hash the password
    hashed_password = generate_password_hash(data['password'])

    # Create the new influencer user object
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        fs_uniquifier=str(uuid.uuid4()),  # Generate a unique identifier
        industry=data['industry'],
        niche=data['niche'],
        reach=data['reach'],
        platform=data['platform'],
        active=True,
    )

    # Save to database
    db.session.add(new_user)
    db.session.commit()

    # Assign 'influencer' role to the user
    influencer_role = Role.query.filter_by(name='influencer').first()
    if influencer_role:
        role_link = RolesUsers(user_id=new_user.id, role_id=influencer_role.id)
        db.session.add(role_link)
        db.session.commit()

    return jsonify({"message": "User created successfully", "role": "influencer"}), 201




@app.get('/admin')
@auth_required("token")
@roles_required("admin")

def admin():
    return "Welcome Admin"


@app.get('/activate/sponsor/<int:sponsorId>')
@auth_required("token")
@roles_required("admin")
def activate_sponsor(sponsorId):

    sponsor=User.query.get(sponsorId)
    # if not sponsor or "inst" not in sponsor.roles:
    #     return jsonify({"message":"Sponsor not found"}),404
    sponsor.active=True
    db.session.commit()
    return jsonify({"message":"User Activated"})


@app.get('/deactivate/sponsor/<int:sponsorId>')
@auth_required("token")
@roles_required("admin")
def de_activate_sponsor(sponsorId):

    sponsor=User.query.get(sponsorId)
   
    # if not sponsor or "inst" not in sponsor.roles:
    #     return jsonify({"message":"Sponsor not found"}),404
    sponsor.active=False
    db.session.commit()
    return jsonify({"message":"User deactivated"})


    
@app.post('/user-login')
def user_login():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({"message": "Email not provided"}), 400
    
    user = datastore.find_user(email=email)

    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Check if the user is activated
    if not user.active:
        return jsonify({"message": "User is not activated"}), 403  # Use 403 Forbidden for not activated users
    
    if check_password_hash(user.password, data.get("password")):
        return jsonify({
            "token": user.get_auth_token(),
            "email": user.email,
            "role": user.roles[0].name
        })
    else:
        return jsonify({"message": "Wrong Password"}), 400





@app.route('/search-influencers', methods=['GET'])
@auth_required("token")
@roles_required("sponsor")
def all_influencers():
    # Get the query parameters for filtering
    niche = request.args.get('niche')
    industry = request.args.get('industry')

    # Query the influencers based on the filters
    query = User.query.join(RolesUsers).join(Role).filter(Role.name == 'influencer')

    if niche:
        query = query.filter(User.niche.ilike(f'%{niche}%'))
    if industry:
        query = query.filter(User.industry.ilike(f'%{industry}%'))

    influencers = query.all()

    if not influencers:
        return jsonify({"message": "No Influencers Found"}), 404
    
    influencer_data = []
    for user in influencers:
        influencer_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "industry": user.industry,
            "niche": user.niche,
            "reach": user.reach,
            "platform": user.platform,
            "active": user.active
        })
    
    return jsonify({"influencer": influencer_data})




@app.route('/search-influencers-query', methods=['GET'])
@auth_required("token")
@roles_required("sponsor")
def search_influencers():
    # Get search parameters from the query string
    niche = request.args.get('niche', '')
    industry = request.args.get('industry', '')

    
    # Fetch the "Influencer" role
    influencer_role = Role.query.filter_by(name="influencer").first()
    if not influencer_role:
        return jsonify({'influencer': []})

    # Join the User, RolesUsers, and Role tables to filter users with the "Influencer" role
    query = User.query.join(RolesUsers).join(Role).filter(
        Role.id == influencer_role.id
    )

    # Query the database for users matching the criteria
    # query = User.query
   
    if niche:
        query = query.filter(User.niche.ilike(f'%{niche}%'))
    if industry:
        query = query.filter(User.industry.ilike(f'%{industry}%'))

    # Fetch the matching users
    influencers = query.all()

    # Serialize the results to JSON
    influencer_list = []
    for user in influencers:
        
        influencer_list.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'industry': user.industry,
            'niche': user.niche,
            'reach': user.reach,
            'platform': user.platform,
            'active': user.active
        })

    # Return the results as a JSON response
    return jsonify({'influencer': influencer_list})






user_fields = {
    "id": fields.Integer,
    "email": fields.String,
    "active": fields.Boolean
}   

@app.route('/users', methods=['GET'])
@auth_required("token")
@roles_required("admin")
def all_users():
    users = User.query.all()
    if not users:
        return jsonify({"message": "No User Found"}), 404

    categorized_users = {
        "admin": [],
        "sponsor": [],
        "influencer": []
    }

    for user in users:
        for role in user.roles:
            if role.name in categorized_users:
                categorized_users[role.name].append(marshal(user, user_fields))

    return jsonify(categorized_users)



@app.get('/study-resource/<int:id>/approve')
@auth_required("token")
@roles_required("inst")
def resource(id):
    study_resource=StudyResource.query.get(id)
    if not study_resource:
        return jsonify({"message": " Resource Not Found" }),404
    
    study_resource.is_approved =True
    db.session.commit()
    return jsonify({"message":"Approved"})




# User name disply api. 
@app.route('/api/user_info', methods=['GET'])
@auth_required("token")
def user_info():
    user = current_user  # Assuming you're using Flask-Security or similar
    return jsonify({"username": user.username})

@app.route('/api/user_info_new', methods=['GET'])
@auth_required("token")
def user_info_new():
    user = current_user  # Assuming you're using Flask-Security or similar
    return jsonify({"username": user.username})


#Campaign display
@app.route('/api/sponsor/campaigns_all', methods=['GET'])
@auth_required("token")
@roles_required("sponsor")
def get_sponsor_campaigns():
    user_id = current_user.id
    campaigns = Campaign.query.filter_by(creator_id=user_id).all()
    
    if not campaigns:
        return jsonify({"message": "No Campaigns Found"}), 404
    
    campaign_fields = {
        'id': fields.Integer,
        'name': fields.String,
        'description': fields.String,
        'start_date': fields.String,
        'end_date': fields.String,
        'budget': fields.Float,
        'visibility': fields.String,
        'goals': fields.String,
        'niche': fields.String,
    }
    
    return jsonify(marshal(campaigns, campaign_fields))





# Fetch all campaign of sponsor for display in the adrequest form. 
@app.route('/api/get-campaigns', methods=['GET'])
@auth_required('token')
@roles_required("sponsor")
def get_campaigns():
    

    # Assuming you have a function to get the campaigns for a specific sponsor
    campaigns = Campaign.query.filter_by(creator_id=current_user.id).all()

    # Serialize the campaigns
    campaign_list = [{'id': campaign.id, 'name': campaign.name} for campaign in campaigns]

    return jsonify({'campaigns': campaign_list})





@app.route('/api/ad-request-from-influencer', methods=['POST'])
@auth_required('token')
def create_ad_request():
    # The influencer (current_user) is available from Flask-Security
    influencer_id = current_user.id

    data = request.get_json()

    # Extract campaign_id, message, payment_amount from request data
    campaign_id = data.get('campaign_id')
    message = data.get('message')
    payment_amount = data.get('payment_amount')

    # Validate inputs
    if not campaign_id or not payment_amount:
        return jsonify({"message": "Campaign ID and Payment Amount are required"}), 400

    # Fetch the campaign from the database
    campaign = Campaign.query.get(campaign_id)
    if not campaign:
        return jsonify({"message": "Campaign not found"}), 404

    # Check if the current user is an influencer
    if "influencer" not in [role.name for role in current_user.roles]:
        return jsonify({"message": "User is not an influencer"}), 403

    # Create a new ad request
    new_ad_request = AdRequest(
        campaign_id=campaign_id,
        influencer_id=influencer_id,
        messages=message,
        payment_amount=payment_amount,
        updated_or_sent_by_influencer=True  # The influencer is sending the request
    )

    # Add the ad request to the database
    db.session.add(new_ad_request)
    db.session.commit()

    return jsonify({"message": "Ad request created successfully", "ad_request_id": new_ad_request.id}), 201







@app.route('/send-ad-request', methods=['POST'])
@auth_required("token")  # Ensure user is authenticated
def send_ad_request():
    try:
        # Get the logged-in user
        current_user_id = current_user.id

        # Parse JSON data from request
        data = request.get_json()

        # Extract fields from data
        influencer_id = data.get('userId')
        ad_details = data.get('adDetails', {})
        campaign_id = data.get('campaignId')
        payment_amount = data.get('paymentAmount', 0.0)  # Default to 0 if not provided

        # Check if campaign and influencer exist
        campaign = Campaign.query.get(campaign_id)
        influencer = User.query.get(influencer_id)

        if not campaign:
            return jsonify({'message': 'Campaign not found'}), 404
        if not influencer:
            return jsonify({'message': 'Influencer not found'}), 404

        # Create the new AdRequest
        new_ad_request = AdRequest(
            campaign_id=campaign_id,
            influencer_id=influencer_id,
            messages=ad_details.get('messages', ''),
            requirements=ad_details.get('requirements', ''),
            payment_amount=payment_amount,
            status='Pending'
        )

        # Add and commit the AdRequest to the database
        db.session.add(new_ad_request)
        db.session.commit()

        # Return success response
        return jsonify({'message': 'Ad request created successfully', 'adRequestId': new_ad_request.id}), 201

    except Exception as e:
        # Handle any errors and rollback the transaction
        db.session.rollback()
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500



# GET PENDING REQUESTS
@app.route('/api/get-pending-requests', methods=['GET'])
@auth_required("token")  # Ensure the user is authenticated
def get_pending_requests():
    try:
        # Get the logged-in influencer's ID
        influencer_id = current_user.id

        # Fetch pending ad requests for this influencer
        pending_requests = AdRequest.query.filter_by(influencer_id=influencer_id, status='Pending').all()

        # Prepare response data
        response = [
            {
                'id': request.id,
                'campaign_name': Campaign.query.get(request.campaign_id).name,  # Fetch campaign name
                'messages': request.messages,
                'requirements': request.requirements,
                'payment_amount': request.payment_amount
            } for request in pending_requests
        ]

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500





@app.route('/api/update-ad-request-status/<int:request_id>', methods=['PUT'])
@auth_required("token")  # Ensure user is authenticated
def update_ad_request_status(request_id):
    try:
        # Parse JSON data from request
        data = request.get_json()
        new_status = data.get('status')

        # Validate the new status
        if new_status not in ['Accepted', 'Rejected']:
            return jsonify({'message': 'Invalid status'}), 400

        # Fetch the ad request by ID
        ad_request = AdRequest.query.get(request_id)
        if not ad_request:
            return jsonify({'message': 'Ad request not found'}), 404

        # Ensure the current user is the influencer assigned to the ad request
        if ad_request.influencer_id != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403

        # Update the status of the ad request
        ad_request.status = new_status
        db.session.commit()

        return jsonify({'message': 'Status updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500




@app.route('/api/get-ad-requests-history', methods=['GET'])
@auth_required("token")  # Ensure user is authenticated
def get_ad_requests_history():
    try:
        # Get the logged-in user (assuming the user is an influencer)
        influencer_id = current_user.id

        # Query all ad requests related to the influencer
        ad_requests = AdRequest.query.filter_by(influencer_id=influencer_id).all()

        # Format the response
        requests_data = [
            {
                'id': request.id,
                'campaign_name': Campaign.query.get(request.campaign_id).name,  # Assuming Campaign model has a 'name' field
                'messages': request.messages,
                'requirements': request.requirements,
                'payment_amount': request.payment_amount,
                'status': request.status,
                'delivery':request.delivery,
                'payment_status':request.payment_status ,
            }
            for request in ad_requests
        ]

        return jsonify(requests_data), 200
    except Exception as e:
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500



@app.route('/api/update-delivery-status', methods=['POST'])
@auth_required('token')
def update_delivery_status():
    data = request.get_json()
    request_id = data.get('requestId')
    delivery_status = data.get('deliveryStatus')

    ad_request = AdRequest.query.get(request_id)
    if not ad_request:
        return jsonify({'message': 'Ad request not found'}), 404

    ad_request.delivery = delivery_status
    db.session.commit()
    
    return jsonify({'message': 'Delivery status updated successfully'}), 200


@app.route('/api/update-payment-status', methods=['POST'])
@auth_required('token')
def update_payment_status():
    data = request.get_json()
    request_id = data.get('requestId')
    payment_status = data.get('paymentStatus')

    ad_request = AdRequest.query.get(request_id)
    if not ad_request:
        return jsonify({'message': 'Ad request not found'}), 404

    ad_request.payment_status = payment_status
    db.session.commit()

    return jsonify({'message': 'Payment status updated successfully'}), 200






@app.route('/api/search-campaigns', methods=['GET'])
def search_campaigns():
    try:
        # Extract search parameters
        niche = request.args.get('niche', '')
        budget = request.args.get('budget', '')

        # Convert budget to float
        try:
            budget = float(budget)
        except ValueError:
            budget = None

        # Build the query
        query = db.session.query(Campaign).filter(Campaign.visibility == 'public')

        if niche:
            query = query.filter(Campaign.niche.ilike(f'%{niche}%'))
        if budget is not None:
            query = query.filter(Campaign.budget <= budget)

        campaigns = query.all()

        # Convert the results to a list of dictionaries
        campaigns_list = [{
            'id': campaign.id,
            'name': campaign.name,
            'description': campaign.description,
            'start_date': campaign.start_date.strftime('%Y-%m-%d'),
            'end_date': campaign.end_date.strftime('%Y-%m-%d'),
            'budget': campaign.budget,
            'goals': campaign.goals,
            'niche': campaign.niche
        } for campaign in campaigns]

        return jsonify({'campaigns': campaigns_list})

    except Exception as e:
        print(e)
        return jsonify({'message': 'An error occurred while searching for campaigns'}), 500
    




@app.route('/api/update-ad-request-sponsor/<int:request_id>', methods=['PUT'])
@auth_required("token")
@roles_required("sponsor")  # Ensure that only sponsors can update ad requests
def update_ad_request_sponsor(request_id):
    print("hii reached here")
    try:
        # Get the data from the request body
        data = request.get_json()
        new_message = data.get('message')
        new_requirements = data.get('requirements')
        new_payment_amount = data.get('payment_amount')

        # Validate payment amount
        if new_payment_amount is None or float(new_payment_amount) <= 0:
            return jsonify({'message': 'Invalid payment amount'}), 400

        # Get the currently logged-in sponsor's ID from Flask-Security's current_user
        sponsor_id = current_user.id  # Flask-Security gives access to the logged-in user's details

        # Query the ad request that is being updated by the sponsor
        ad_request = AdRequest.query.join(Campaign).filter(
            AdRequest.id == request_id,
            Campaign.creator_id == sponsor_id  # Ensuring the sponsor owns the campaign
        ).first()

        # Check if the ad request exists and belongs to a campaign by the sponsor
        if not ad_request:
            return jsonify({'message': 'Ad request not found or unauthorized'}), 404

        # Update the ad request with new data
        ad_request.messages = new_message if new_message else ad_request.messages
        ad_request.requirements = new_requirements if new_requirements else ad_request.requirements
        ad_request.payment_amount = new_payment_amount
        ad_request.updated_or_sent_by_influencer=False
        # Save the changes to the database
        db.session.commit()

        return jsonify({'message': 'Ad request updated successfully'}), 200

    except Exception as e:
        print(e)
        return jsonify({'message': 'An error occurred while updating the ad request'}), 500


@app.put('/api/sponsor/campaigns/<int:campaign_id>')
@auth_required("token")
@roles_required("sponsor")  # Assuming only sponsors can edit campaigns
def update_campaign(campaign_id):
    # Fetch the campaign to update
    campaign = Campaign.query.filter_by(id=campaign_id, creator_id=current_user.id).first()
 
    if not campaign:
        return jsonify({"message": "Campaign not found or you do not have permission to edit this campaign."}), 404

    # Parse the data from the request body
    data = request.json
    print(data)
    try:
        # Update only provided fields and ensure proper validation
        if 'start_date' in data:
           
            campaign.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()   
            
        if 'end_date' in data:
         
            campaign.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
          
     

        if 'budget' in data:
            try:
                campaign.budget = float(data['budget'])
                if campaign.budget <= 0:
                    return jsonify({"message": "Budget must be a positive number."}), 400
            except ValueError:
                return jsonify({"message": "Invalid budget value."}), 400

        if 'goals' in data:
            campaign.goals = data['goals'] if data['goals'].strip() else None

        # Save changes to the database
        db.session.commit()

        return jsonify({
            "message": "Campaign updated successfully",
            "campaign": {
                "id": campaign.id,
                "name": campaign.name,
                "start_date": campaign.start_date.strftime('%Y-%m-%d'),
                "end_date": campaign.end_date.strftime('%Y-%m-%d'),
                "budget": campaign.budget,
                "goals": campaign.goals
            }
        }), 200
     
    except Exception as e:
        db.session.rollback()  # Rollback in case of an error
        return jsonify({"message": "An error occurred while updating the campaign: " + str(e)}), 500
  








@app.delete('/api/sponsor/campaigns/<int:campaign_id>/delete')
@auth_required("token")
def delete_campaign(campaign_id):
    try:
        # Find the campaign by ID
        campaign = Campaign.query.get(campaign_id)

        # Check if the campaign exists
        if not campaign:
            return jsonify({"message": "Campaign not found"}), 404

        # Check if the user is either an admin or the sponsor who created the campaign
        if "admin" not in [role.name for role in current_user.roles] and campaign.creator_id != current_user.id:
            return jsonify({"message": "Unauthorized action"}), 403

        # Delete the campaign
        db.session.delete(campaign)
        db.session.commit()

        return jsonify({"message": "Campaign deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()  # Rollback if there's any error
        return jsonify({"message": "An error occurred while deleting the campaign: " + str(e)}), 500





@app.get('/create-csv')
@auth_required("token")
@roles_required("sponsor")
def create_csv():
    # sponsor_id = request.args.get('sponsor_id')
    sponsor_id = current_user.id
    task=create_campaign_csv.delay(sponsor_id)
    return jsonify({"task-id":task.id})


@app.get('/get-csv/<task_id>')
def get_csv(task_id):
 
    res=AsyncResult(task_id)
    if res.ready():
        filename=res.result
        return send_file(filename,as_attachment=True)
    else:
        return jsonify({"message":"Task Pending"}),404






# -----------------------



@app.route('/api/negotiate-ad-request/<int:request_id>', methods=['PUT'])
@auth_required("token")
@roles_required("influencer")  # Ensure that only sponsors can delete campaigns
def negotiate_ad_request(request_id):
    try:
        # Get the data from the request body
        data = request.get_json()
        new_message = data.get('message')
        new_payment_amount = data.get('payment_amount')


        new_payment_amount = float(new_payment_amount)
        # Validate payment amount
        if new_payment_amount is None or new_payment_amount <= 0:
            return jsonify({'message': 'Invalid payment amount'}), 400

        # Get the currently logged-in influencer's ID from Flask-Security's current_user
        influencer_id = current_user.id  # Flask-Security gives access to the logged-in user's details

        # Query the ad request to negotiate
        ad_request = AdRequest.query.filter_by(id=request_id, influencer_id=influencer_id).first()

        # Check if the ad request exists and belongs to the influencer
        if not ad_request:
            return jsonify({'message': 'Ad request not found or unauthorized'}), 404

        # Update the ad request with new message and payment amount
        ad_request.messages = new_message if new_message else ad_request.messages
        ad_request.payment_amount = new_payment_amount
        ad_request.updated_or_sent_by_influencer=True
        # Save the changes to the database
        db.session.commit()

        return jsonify({'message': 'Ad request negotiation submitted successfully'}), 200

    except Exception as e:
        print(e)
        return jsonify({'message': 'An error occurred during negotiation'}), 500










@app.route('/api/get-sponsor-pending-requests', methods=['GET'])
@auth_required("token")
@roles_required("sponsor")  # Ensure that only sponsors can delete campaigns
def get_sponsor_pending_requests():
    try:
        # Get the current sponsor's ID from the current_user object provided by Flask-Security
        sponsor_id = current_user.id

        
        campaigns = Campaign.query.filter_by(creator_id=sponsor_id).all()
        campaign_ids = [campaign.id for campaign in campaigns]

        if not campaign_ids:
            return jsonify([]), 200  # No campaigns found for this sponsor

        # Query ad requests for those campaigns where updated_or_sent_by_influencer is True
        pending_requests = AdRequest.query \
            .filter(AdRequest.campaign_id.in_(campaign_ids), AdRequest.updated_or_sent_by_influencer.is_(True)) \
            .all()

       
        print(pending_requests)
        # Return the relevant data
        result = []
        for req in pending_requests:
            result.append({
                'id': req.id,
                'campaign_name': req.campaign.name,
                'messages': req.messages,
                'requirements': req.requirements,
                'payment_amount': req.payment_amount,
                'status': req.status
            })

        return jsonify(result), 200

    except Exception as e:
        print(e)
        return jsonify({'message': 'An error occurred while fetching pending requests'}), 500









@app.route('/api/update-ad-request-status-sponsor/<int:request_id>', methods=['PUT'])
def update_ad_request_status_sponsor(request_id):
    try:
        # Parse JSON data from request
        data = request.get_json()
        new_status = data.get('status')

        # Validate the new status
        if new_status not in ['Accepted', 'Rejected']:
            return jsonify({'message': 'Invalid status'}), 400

        # Fetch the ad request by ID
        ad_request = AdRequest.query.get(request_id)
        if not ad_request:
            return jsonify({'message': 'Ad request not found'}), 404

        # Update the status of the ad request
        ad_request.status = new_status
        ad_request.updated_or_sent_by_influencer=False
        db.session.commit()

        return jsonify({'message': 'Status updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'An error occurred: {str(e)}'}), 500





@app.route('/api/search-ongoing-campaigns', methods=['GET'])
def search_ongoing_campaigns():
    try:
        # Get search parameters
        niche = request.args.get('niche')
        budget = request.args.get('budget')

        # Start building the query
        query = Campaign.query

        # Apply filters based on search parameters
        if niche:
            query = query.filter(Campaign.niche.ilike(f'%{niche}%'))  # Case-insensitive search
        if budget:
            budget = float(budget)  # Convert to float for comparison
            query = query.filter(Campaign.budget >= budget)  # Assuming we want campaigns within the budget

        # Fetch results
        campaigns = query.all()

        # Prepare the response
        result = []
        for campaign in campaigns:
            result.append({
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'start_date': campaign.start_date.isoformat(),  # Convert to string format
                'end_date': campaign.end_date.isoformat(),
                'budget': campaign.budget,
                'goals': campaign.goals,
                'niche': campaign.niche
            })

        return jsonify({'campaigns': result}), 200

    except Exception as e:
        print(f"Error fetching campaigns: {e}")
        return jsonify({'message': 'An error occurred while fetching campaigns'}), 500
    

@app.route('/all-campaigns', methods=['GET'])
@auth_required('token')
def get_all_campaigns():
    # Fetch all campaigns from the database
    campaigns = Campaign.query.all()

    # Convert campaigns to a dictionary format
    campaigns_data = [
        {
            "id": campaign.id,
            "name": campaign.name,
            "description": campaign.description,
            "start_date": campaign.start_date,
            "end_date": campaign.end_date,
            "budget": campaign.budget,
            "niche": campaign.niche,
            "goals": campaign.goals
        }
        for campaign in campaigns
    ]

    return jsonify(campaigns_data), 200



@app.route('/api/admin/statistics')
@auth_required('token')
@roles_required('admin')  # Ensure only admin has access
def get_statistics():
    # Query total active users
    total_active_users = User.query.filter_by(active=True).count()
    
    # Query the total number of sponsors
    sponsor_role = Role.query.filter_by(name='sponsor').first()
    total_sponsors = sponsor_role.users.filter(User.active == True).count() if sponsor_role else 0

    # Query the total number of influencers
    influencer_role = Role.query.filter_by(name='influencer').first()
    total_influencers = influencer_role.users.filter(User.active == True).count() if influencer_role else 0

    return jsonify({
        "total_active_users": total_active_users,
        "total_sponsors": total_sponsors,
        "total_influencers": total_influencers
    })



@app.route('/api/ad_requests/stats', methods=['GET'])
def ad_request_stats():
    # Count the ad requests based on status
    pending_count = AdRequest.query.filter_by(status='Pending').count()
    accepted_count = AdRequest.query.filter_by(status='Accepted').count()
    
    # Count the delivery status
    delivery_pending_count = AdRequest.query.filter_by(delivery='Pending').count()
    delivery_done_count = AdRequest.query.filter_by(delivery='Done').count()

    return jsonify({
        'total_pending_requests': pending_count,
        'total_accepted_requests': accepted_count,
        'total_delivery_pending_requests': delivery_pending_count,  # Add this line
        'total_delivery_done_requests': delivery_done_count  # Add this line
    })


@app.route('/api/influencer-detail', methods=['GET'])
@auth_required("token")
@roles_required("influencer")
def get_influencer_detail():
    user_id = current_user.id
    user = User.query.filter_by(id=user_id).first()  # Use .first() to get a single user

    if not user:
        return jsonify({"message": "No Influencer Found"}), 404  # Updated message for clarity

    user_fields = {
        'id':fields.Integer,
        'username': fields.String,  # Include username
        'email': fields.String,  # Include email
        'industry': fields.String,  # Include industry
        'niche': fields.String,  # Include niche
        'reach': fields.String,  # Include reach
        'platform': fields.String,  # Include platform
    }

    return jsonify(marshal(user, user_fields))  # Return the user's details


@app.put('/api/update-info-influencer/<int:user_id_1>')
@auth_required("token")
@roles_required("influencer")
def update_user_info(user_id_1):
    user_id = current_user.id
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.json
    print(data)
    try:
        # Update user details only if provided in the request
        for field in ['username', 'email', 'industry', 'niche', 'reach', 'platform']:
            if field in data:
                setattr(user, field, data[field].strip())  # Set attribute dynamically

        db.session.commit()

        return jsonify({
            "message": "User details updated successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "industry": user.industry,
                "niche": user.niche,
                "reach": user.reach,
                "platform": user.platform
            }
        }), 200
     
    except Exception as e:
        db.session.rollback()  
        print(f"Error updating user details: {e}")  # Log the error
        return jsonify({"message": "An error occurred while updating user details: " + str(e)}), 500
