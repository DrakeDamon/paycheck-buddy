from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_migrate import Migrate
from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError
from datetime import datetime

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
    migrate = Migrate(app, db)  # Add Flask-Migrate
    CORS(app)
    jwt = JWTManager(app)
    
    # Database tables will be created by migrations instead of create_all()
    # Commented out for now - use migrations instead
    # with app.app_context():
    #     db.create_all()
    
    # Add this route to your create_app function, before the return app statement
    @app.route('/')
    def index():
        """List all registered routes with their endpoints and methods."""
        routes = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(sorted(rule.methods - {'OPTIONS', 'HEAD'}))
            routes.append(f"{rule} [{methods}]")
        
        # Sort routes alphabetically
        routes.sort()
        
        response = {
            "app_name": "PaycheckBuddy API",
            "description": "A budgeting app that organizes finances by time periods",
            "version": "1.0.0",
            "routes": routes,
            "documentation": "Visit /api-docs for detailed API documentation (if implemented)"
        }
        
        return jsonify(response), 200
    # Authentication routes
    @app.route('/api/auth/register', methods=['POST'])
    def register():
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"error": "Username and password are required"}), 400
        
        try:
            user = User(username=data['username'])
            user.password = data['password']
            db.session.add(user)
            db.session.commit()
            
            # Create tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            return jsonify({
                "message": "User created successfully",
                "user": user_schema.dump(user),
                "access_token": access_token,
                "refresh_token": refresh_token
            }), 201
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Username already exists"}), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({"error": "Username and password are required"}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if user and user.verify_password(data['password']):
            # Create tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            
            return jsonify({
                "message": "Login successful",
                "user": user_schema.dump(user),
                "access_token": access_token,
                "refresh_token": refresh_token
            }), 200
        
        return jsonify({"error": "Invalid username or password"}), 401
    
    @app.route('/api/auth/refresh', methods=['POST'])
    @jwt_required(refresh=True)
    def refresh_token():
        current_user_id = get_jwt_identity()
        access_token = create_access_token(identity=str(current_user_id))
        
        return jsonify({
            "access_token": access_token
        }), 200
    
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