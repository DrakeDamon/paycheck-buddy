from flask import Flask, jsonify, request
from flask_restful import Api, Resource, reqparse
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
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    CORS(app)
    jwt = JWTManager(app)
    
    # Initialize Flask-RESTful
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
        return jsonify(response), 200
    

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
    
    # API Routes for TimePeriod
    @app.route('/api/time_periods', methods=['GET'])
    @jwt_required()
    def get_time_periods():
        time_periods = TimePeriod.query.all()
        return jsonify(time_periods_schema.dump(time_periods)), 200
    
    @app.route('/api/time_periods', methods=['POST'])
    @jwt_required()
    def create_time_period():
        data = request.get_json()
        
        try:
            time_period = time_period_schema.load(data)
            db.session.add(time_period)
            db.session.commit()
            return jsonify(time_period_schema.dump(time_period)), 201
        except ValidationError as err:
            return jsonify({"error": err.messages}), 400
    
    @app.route('/api/time_periods/<int:id>', methods=['GET'])
    @jwt_required()
    def get_time_period(id):
        time_period = TimePeriod.query.get_or_404(id)
        return jsonify(time_period_schema.dump(time_period)), 200
    
    @app.route('/api/time_periods/<int:id>', methods=['PUT'])
    @jwt_required()
    def update_time_period(id):
        time_period = TimePeriod.query.get_or_404(id)
        data = request.get_json()
        
        try:
            updated_time_period = time_period_schema.load(data, instance=time_period, partial=True)
            db.session.commit()
            return jsonify(time_period_schema.dump(updated_time_period)), 200
        except ValidationError as err:
            return jsonify({"error": err.messages}), 400
    
    @app.route('/api/time_periods/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_time_period(id):
        time_period = TimePeriod.query.get_or_404(id)
        db.session.delete(time_period)
        db.session.commit()
        return '', 204
    
    # API Routes for Expenses
    @app.route('/api/expenses', methods=['GET'])
    @jwt_required()
    def get_expenses():
        current_user_id = get_jwt_identity()
        expenses = Expense.query.filter_by(user_id=current_user_id).all()
        return jsonify(expenses_schema.dump(expenses)), 200
    
    @app.route('/api/expenses', methods=['POST'])
    @jwt_required()
    def create_expense():
        current_user_id = get_jwt_identity()
        data = request.get_json()
        data['user_id'] = current_user_id
        
        try:
            expense = expense_schema.load(data)
            db.session.add(expense)
            db.session.commit()
            return jsonify(expense_schema.dump(expense)), 201
        except ValidationError as err:
            return jsonify({"error": err.messages}), 400
    
    @app.route('/api/expenses/<int:id>', methods=['GET'])
    @jwt_required()
    def get_expense(id):
        current_user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=id, user_id=current_user_id).first_or_404()
        return jsonify(expense_schema.dump(expense)), 200
    
    @app.route('/api/expenses/<int:id>', methods=['PUT'])
    @jwt_required()
    def update_expense(id):
        current_user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=id, user_id=current_user_id).first_or_404()
        data = request.get_json()
        
        try:
            updated_expense = expense_schema.load(data, instance=expense, partial=True)
            db.session.commit()
            return jsonify(expense_schema.dump(updated_expense)), 200
        except ValidationError as err:
            return jsonify({"error": err.messages}), 400
    
    @app.route('/api/expenses/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_expense(id):
        current_user_id = get_jwt_identity()
        expense = Expense.query.filter_by(id=id, user_id=current_user_id).first_or_404()
        db.session.delete(expense)
        db.session.commit()
        return '', 204
    
    # API Routes for Paychecks
    @app.route('/api/paychecks', methods=['GET'])
    @jwt_required()
    def get_paychecks():
        current_user_id = get_jwt_identity()
        paychecks = Paycheck.query.filter_by(user_id=current_user_id).all()
        return jsonify(paychecks_schema.dump(paychecks)), 200
    
    @app.route('/api/paychecks', methods=['POST'])
    @jwt_required()
    def create_paycheck():
        current_user_id = get_jwt_identity()
        data = request.get_json()
        data['user_id'] = current_user_id
        
        try:
            paycheck = paycheck_schema.load(data)
            db.session.add(paycheck)
            db.session.commit()
            return jsonify(paycheck_schema.dump(paycheck)), 201
        except ValidationError as err:
            return jsonify({"error": err.messages}), 400
    
    @app.route('/api/paychecks/<int:id>', methods=['GET'])
    @jwt_required()
    def get_paycheck(id):
        current_user_id = get_jwt_identity()
        paycheck = Paycheck.query.filter_by(id=id, user_id=current_user_id).first_or_404()
        return jsonify(paycheck_schema.dump(paycheck)), 200
    
    @app.route('/api/paychecks/<int:id>', methods=['PUT'])
    @jwt_required()
    def update_paycheck(id):
        current_user_id = get_jwt_identity()
        paycheck = Paycheck.query.filter_by(id=id, user_id=current_user_id).first_or_404()
        data = request.get_json()
        
        try:
            updated_paycheck = paycheck_schema.load(data, instance=paycheck, partial=True)
            db.session.commit()
            return jsonify(paycheck_schema.dump(updated_paycheck)), 200
        except ValidationError as err:
            return jsonify({"error": err.messages}), 400
    
    @app.route('/api/paychecks/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_paycheck(id):
        current_user_id = get_jwt_identity()
        paycheck = Paycheck.query.filter_by(id=id, user_id=current_user_id).first_or_404()
        db.session.delete(paycheck)
        db.session.commit()
        return '', 204
    
    # Single API endpoint to load all user data
    @app.route('/api/user_data', methods=['GET'])
    @jwt_required()
    def get_user_data():
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        
        # Get all time periods that have expenses or paychecks for this user
        user_time_periods = set()
        
        for expense in user.expenses:
            user_time_periods.add(expense.time_period)
            
        for paycheck in user.paychecks:
            user_time_periods.add(paycheck.time_period)
        
        return jsonify(user_data_schema.dump(user)), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500
    
    return app

# This creates an app instance when file is run directly
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5555)