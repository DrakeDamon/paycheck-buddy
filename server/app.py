from flask import Flask, jsonify, request
from flask_restful import Api, Resource
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_migrate import Migrate
from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError

from config import Config
from models import db, User, TimePeriod, Expense, Paycheck
from schemas import user_schema, users_schema, time_period_schema, time_periods_schema, \
                    expense_schema, expenses_schema, paycheck_schema, paychecks_schema, \
                    user_data_schema

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    Migrate(app, db)
    CORS(app)
    JWTManager(app)
    
    api = Api(app)
    
     # Home route to document available endpoints
    @app.route('/')
    def home():
        return jsonify({
            "endpoints": {
                # Authentication endpoints
                "POST /api/auth/register": "Register a new user",
                "POST /api/auth/login": "Login and get access token",
                "POST /api/auth/refresh": "Refresh access token",
                
                # Time Period endpoints (central organizing principle)
                "GET /api/time_periods": "Get all time periods for current user",
                "POST /api/time_periods": "Create a new time period",
                "GET /api/time_periods/:id": "Get a specific time period",
                "PUT /api/time_periods/:id": "Update a time period",
                "DELETE /api/time_periods/:id": "Delete a time period",
                
                # Expense endpoints through time periods
                "GET /api/time_periods/:id/expenses": "Get all expenses for a time period",
                "POST /api/time_periods/:id/expenses": "Add an expense to a time period",
                "GET /api/time_periods/:id/expenses/:expense_id": "Get specific expense in a time period",
                "PUT /api/time_periods/:id/expenses/:expense_id": "Update specific expense in a time period",
                "DELETE /api/time_periods/:id/expenses/:expense_id": "Delete specific expense in a time period",
                "GET /api/time_periods/all/expenses": "Get all expenses across all time periods",
                
                # Paycheck endpoints through time periods
                "GET /api/time_periods/:id/paychecks": "Get all paychecks for a time period",
                "POST /api/time_periods/:id/paychecks": "Add a paycheck to a time period",
                "GET /api/time_periods/:id/paychecks/:paycheck_id": "Get specific paycheck in a time period",
                "PUT /api/time_periods/:id/paychecks/:paycheck_id": "Update specific paycheck in a time period",
                "DELETE /api/time_periods/:id/paychecks/:paycheck_id": "Delete specific paycheck in a time period",
                "GET /api/time_periods/all/paychecks": "Get all paychecks across all time periods",
                
                # Summary endpoint
                "GET /api/time_periods/:id/summary": "Get income vs. expenses summary for a time period",
                
                # User Data endpoint
                "GET /api/user_data": "Get all user data in a single request (efficient loading)"
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    class RegisterResource(Resource):
        def post(self):
            data = request.get_json()
            
            # Validate input
            if not data or not data.get('username') or not data.get('password'):
                return {"error": "Username and password are required"}, 400
            
            try:
                user = User(username=data['username'])
                user.password = data['password']
                db.session.add(user)
                db.session.commit()
                
                # Create tokens
                access_token = create_access_token(identity=str(user.id))
                refresh_token = create_refresh_token(identity=str(user.id))
                
                return {
                    "message": "User created successfully",
                    "user": user_schema.dump(user),
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }, 201
            except IntegrityError:
                db.session.rollback()
                return {"error": "Username already exists"}, 409
            except Exception as e:
                db.session.rollback()
                return {"error": str(e)}, 500
    
    class LoginResource(Resource):
        def post(self):
            data = request.get_json()
            
            # Validate input
            if not data or not data.get('username') or not data.get('password'):
                return {"error": "Username and password are required"}, 400
            
            user = User.query.filter_by(username=data['username']).first()
            
            if user and user.verify_password(data['password']):
                # Create tokens
                access_token = create_access_token(identity=str(user.id))
                refresh_token = create_refresh_token(identity=str(user.id))
                
                return {
                    "message": "Login successful",
                    "user": user_schema.dump(user),
                    "access_token": access_token,
                    "refresh_token": refresh_token
                }, 200
            
            return {"error": "Invalid username or password"}, 401
    
    class TokenRefreshResource(Resource):
        @jwt_required(refresh=True)
        def post(self):
            current_user_id = get_jwt_identity()
            access_token = create_access_token(identity=str(current_user_id))
            
            return {
                "access_token": access_token
            }, 200
    
    # Time Period Resources
    class TimePeriodListResource(Resource):
        @jwt_required()
        def get(self):
            current_user_id = get_jwt_identity()
            user = User.query.get_or_404(current_user_id)
            
            # Get time periods through association proxies
            user_time_periods = set()
            for expense in user.expenses:
                user_time_periods.add(expense.time_period)
            for paycheck in user.paychecks:
                user_time_periods.add(paycheck.time_period)
            
            # If no time periods found, return system defined time periods
            if not user_time_periods:
                time_periods = TimePeriod.query.all()
                if time_periods:
                    return time_periods_schema.dump(time_periods), 200
            
            return time_periods_schema.dump(list(user_time_periods)), 200
        
        @jwt_required()
        def post(self):
            data = request.get_json()
            
            try:
                time_period = time_period_schema.load(data)
                db.session.add(time_period)
                db.session.commit()
                return time_period_schema.dump(time_period), 201
            except ValidationError as err:
                return {"error": err.messages}, 400
    
    class TimePeriodDetailResource(Resource):
        @jwt_required()
        def get(self, time_period_id):
            time_period = TimePeriod.query.get_or_404(time_period_id)
            return time_period_schema.dump(time_period), 200
        
        @jwt_required()
        def put(self, time_period_id):
            time_period = TimePeriod.query.get_or_404(time_period_id)
            data = request.get_json()
            
            try:
                updated_time_period = time_period_schema.load(data, instance=time_period, partial=True)
                db.session.commit()
                return time_period_schema.dump(updated_time_period), 200
            except ValidationError as err:
                return {"error": err.messages}, 400
        
        @jwt_required()
        def delete(self, time_period_id):
            time_period = TimePeriod.query.get_or_404(time_period_id)
            db.session.delete(time_period)
            db.session.commit()
            return '', 204
    
    # Time Period Expenses Resources
    class TimePeriodExpenseCollectionResource(Resource):
        @jwt_required()
        def get(self, time_period_id):
            current_user_id = get_jwt_identity()
            
            # Handle special 'all' case to get expenses across all time periods
            if time_period_id == 'all':
                expenses = Expense.query.filter_by(user_id=current_user_id).all()
                return expenses_schema.dump(expenses), 200
            
            # Get expenses for a specific time period - skip loading time_period object
            expenses = Expense.query.filter_by(
                user_id=current_user_id,
                time_period_id=time_period_id
            ).all()
            
            return expenses_schema.dump(expenses), 200
        
        @jwt_required()
        def post(self, time_period_id):
            current_user_id = get_jwt_identity()
            
            # Can't post to 'all'
            if time_period_id == 'all':
                return {"error": "Cannot create an expense without specifying a time period"}, 400
            
            # Verify time period exists (404 if not)
            TimePeriod.query.get_or_404(time_period_id)
            
            data = request.get_json()
            data['time_period_id'] = time_period_id
            data['user_id'] = current_user_id
            
            try:
                expense = expense_schema.load(data)
                db.session.add(expense)
                db.session.commit()
                return expense_schema.dump(expense), 201
            except ValidationError as err:
                return {"error": err.messages}, 400
    
    class TimePeriodExpenseDetailResource(Resource):
        @jwt_required()
        def get(self, time_period_id, expense_id):
            current_user_id = get_jwt_identity()
            expense = Expense.query.filter_by(
                id=expense_id,
                time_period_id=time_period_id,
                user_id=current_user_id
            ).first_or_404()
            return expense_schema.dump(expense), 200
        
        @jwt_required()
        def put(self, time_period_id, expense_id):
            current_user_id = get_jwt_identity()
            expense = Expense.query.filter_by(
                id=expense_id,
                time_period_id=time_period_id,
                user_id=current_user_id
            ).first_or_404()
            data = request.get_json()
            
            try:
                updated_expense = expense_schema.load(data, instance=expense, partial=True)
                db.session.commit()
                return expense_schema.dump(updated_expense), 200
            except ValidationError as err:
                return {"error": err.messages}, 400
        
        @jwt_required()
        def delete(self, time_period_id, expense_id):
            current_user_id = get_jwt_identity()
            expense = Expense.query.filter_by(
                id=expense_id,
                time_period_id=time_period_id,
                user_id=current_user_id
            ).first_or_404()
            db.session.delete(expense)
            db.session.commit()
            return '', 204
    
    # Time Period Paychecks Resources
    class TimePeriodPaycheckCollectionResource(Resource):
        @jwt_required()
        def get(self, time_period_id):
            current_user_id = get_jwt_identity()
            
            # Handle special 'all' case to get paychecks across all time periods
            if time_period_id == 'all':
                paychecks = Paycheck.query.filter_by(user_id=current_user_id).all()
                return paychecks_schema.dump(paychecks), 200
            
            # Get paychecks for a specific time period - skip loading time_period object
            paychecks = Paycheck.query.filter_by(
                user_id=current_user_id,
                time_period_id=time_period_id
            ).all()
            
            return paychecks_schema.dump(paychecks), 200
        
        @jwt_required()
        def post(self, time_period_id):
            current_user_id = get_jwt_identity()
            
            # Can't post to 'all'
            if time_period_id == 'all':
                return {"error": "Cannot create a paycheck without specifying a time period"}, 400
            
            # Verify time period exists (404 if not)
            TimePeriod.query.get_or_404(time_period_id)
            
            data = request.get_json()
            data['time_period_id'] = time_period_id
            data['user_id'] = current_user_id
            
            try:
                paycheck = paycheck_schema.load(data)
                db.session.add(paycheck)
                db.session.commit()
                return paycheck_schema.dump(paycheck), 201
            except ValidationError as err:
                return {"error": err.messages}, 400
    
    class TimePeriodPaycheckDetailResource(Resource):
        @jwt_required()
        def get(self, time_period_id, paycheck_id):
            current_user_id = get_jwt_identity()
            paycheck = Paycheck.query.filter_by(
                id=paycheck_id,
                time_period_id=time_period_id,
                user_id=current_user_id
            ).first_or_404()
            return paycheck_schema.dump(paycheck), 200
        
        @jwt_required()
        def put(self, time_period_id, paycheck_id):
            current_user_id = get_jwt_identity()
            paycheck = Paycheck.query.filter_by(
                id=paycheck_id,
                time_period_id=time_period_id,
                user_id=current_user_id
            ).first_or_404()
            data = request.get_json()
            
            try:
                updated_paycheck = paycheck_schema.load(data, instance=paycheck, partial=True)
                db.session.commit()
                return paycheck_schema.dump(updated_paycheck), 200
            except ValidationError as err:
                return {"error": err.messages}, 400
        
        @jwt_required()
        def delete(self, time_period_id, paycheck_id):
            current_user_id = get_jwt_identity()
            paycheck = Paycheck.query.filter_by(
                id=paycheck_id,
                time_period_id=time_period_id,
                user_id=current_user_id
            ).first_or_404()
            db.session.delete(paycheck)
            db.session.commit()
            return '', 204

    # Time Period Summary Resource
    class TimePeriodSummaryResource(Resource):
        @jwt_required()
        def get(self, time_period_id):
            current_user_id = get_jwt_identity()
            
            # Verify the time period exists
            time_period = TimePeriod.query.get_or_404(time_period_id)
            
            # Get data for this time period and user
            expenses = Expense.query.filter_by(
                user_id=current_user_id,
                time_period_id=time_period_id
            ).all()
            paychecks = Paycheck.query.filter_by(
                user_id=current_user_id,
                time_period_id=time_period_id
            ).all()
            
            # Format response
            result = {
                "time_period": time_period_schema.dump(time_period),
                "expenses": expenses_schema.dump(expenses),
                "paychecks": paychecks_schema.dump(paychecks)
            }
            
            return result, 200

    # User Data Resource
    class UserDataResource(Resource):
        @jwt_required()
        def get(self):
            current_user_id = get_jwt_identity()
            user = User.query.get_or_404(current_user_id)
            return user_data_schema.dump(user), 200
    
    # Register resources with the API
    api.add_resource(RegisterResource, '/api/auth/register')
    api.add_resource(LoginResource, '/api/auth/login')
    api.add_resource(TokenRefreshResource, '/api/auth/refresh')
    
    # Time Periods
    api.add_resource(TimePeriodListResource, '/api/time_periods')
    api.add_resource(TimePeriodDetailResource, '/api/time_periods/<int:time_period_id>')
    
    # Expense resources
    api.add_resource(TimePeriodExpenseCollectionResource, 
                     '/api/time_periods/<int:time_period_id>/expenses',
                     '/api/time_periods/<string:time_period_id>/expenses')
    api.add_resource(TimePeriodExpenseDetailResource, 
                     '/api/time_periods/<int:time_period_id>/expenses/<int:expense_id>')
    
    # Paycheck resources
    api.add_resource(TimePeriodPaycheckCollectionResource, 
                    '/api/time_periods/<int:time_period_id>/paychecks',
                    '/api/time_periods/<string:time_period_id>/paychecks')
    api.add_resource(TimePeriodPaycheckDetailResource, 
                    '/api/time_periods/<int:time_period_id>/paychecks/<int:paycheck_id>')
    
    # Summary route
    api.add_resource(TimePeriodSummaryResource, '/api/time_periods/<int:time_period_id>/summary')
    
    # Single API endpoint for efficient data loading
    api.add_resource(UserDataResource, '/api/user_data')
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5555)