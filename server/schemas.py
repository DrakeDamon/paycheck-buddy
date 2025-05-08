# server/schemas.py
from flask_marshmallow import Marshmallow
from marshmallow import fields, validates, ValidationError, post_load
from models import User, TimePeriod, Expense, Paycheck, db

ma = Marshmallow()

class UserSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User
        load_instance = True
    
    id = ma.auto_field(dump_only=True)
    username = ma.auto_field(required=True)
    password = fields.String(required=True, load_only=True)  # Only load, never dump
    
    @post_load
    def make_user(self, data, **kwargs):
        if 'instance' not in kwargs:  # Only set password for new users
            if 'password' in data:
                password = data.pop('password')
                user = User(**data)
                user.password = password
                return user
        return data

class ExpenseSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Expense
        load_instance = True
    
    id = ma.auto_field(dump_only=True)
    user_id = ma.auto_field(required=True)
    time_period_id = ma.auto_field(required=True)
    description = ma.auto_field(required=True)
    amount = ma.auto_field(required=True)
    due_date = ma.auto_field()
    is_recurring = ma.auto_field()
    recurrence_interval = ma.auto_field()
    category = ma.auto_field()
    currency = ma.auto_field()
    
    @validates('amount')
    def validate_amount(self, value):
        if value <= 0:
            raise ValidationError("Amount must be greater than 0")

class PaycheckSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Paycheck
        load_instance = True
    
    id = ma.auto_field(dump_only=True)
    user_id = ma.auto_field(required=True)
    time_period_id = ma.auto_field(required=True)
    amount = ma.auto_field(required=True)
    date_received = ma.auto_field()
    currency = ma.auto_field()
    
    @validates('amount')
    def validate_amount(self, value):
        if value <= 0:
            raise ValidationError("Amount must be greater than 0")

class TimePeriodSchema(ma.SQLAlchemySchema):
    class Meta:
        model = TimePeriod
        load_instance = True
    
    id = ma.auto_field(dump_only=True)
    type = ma.auto_field(required=True)
    
    # Add nested fields for related expenses and paychecks
    expenses = fields.List(fields.Nested(lambda: ExpenseSchema(exclude=('time_period_id',))), dump_only=True)
    paychecks = fields.List(fields.Nested(lambda: PaycheckSchema(exclude=('time_period_id',))), dump_only=True)
    
    @validates('type')
    def validate_type(self, value):
        # Only validate that it's not empty and is a reasonable length
        if not value or not isinstance(value, str):
            raise ValidationError("Time period type must be a non-empty string")
        if len(value) < 2 or len(value) > 50:
            raise ValidationError("Time period type must be between 2 and 50 characters")
        return value

class UserDataSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User
    
    id = ma.auto_field()
    username = ma.auto_field()
    
    # Include time periods with nested expenses and paychecks
    time_periods = fields.Method('get_time_periods_with_data')
    
    def get_time_periods_with_data(self, obj):
        # Get all time periods
        all_time_periods = TimePeriod.query.all()
        user_id = obj.id
        
        result = []
        for period in all_time_periods:
            # Get user's expenses and paychecks for this period
            period_expenses = Expense.query.filter_by(user_id=user_id, time_period_id=period.id).all()
            period_paychecks = Paycheck.query.filter_by(user_id=user_id, time_period_id=period.id).all()
            
            # Prepare period data with nested relationships
            period_data = {
                'id': period.id,
                'type': period.type,
                'expenses': ExpenseSchema(many=True, exclude=('time_period_id',)).dump(period_expenses),
                'paychecks': PaycheckSchema(many=True, exclude=('time_period_id',)).dump(period_paychecks)
            }
            result.append(period_data)
            
        return result

# Initialize schema instances
user_schema = UserSchema()
users_schema = UserSchema(many=True)
time_period_schema = TimePeriodSchema()
time_periods_schema = TimePeriodSchema(many=True)
expense_schema = ExpenseSchema()
expenses_schema = ExpenseSchema(many=True)
paycheck_schema = PaycheckSchema()
paychecks_schema = PaycheckSchema(many=True)
user_data_schema = UserDataSchema()