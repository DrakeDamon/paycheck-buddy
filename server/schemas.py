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
    
    # We don't include relationships in the base schema to avoid circular references
    
    @post_load
    def make_user(self, data, **kwargs):
        if 'instance' not in kwargs:  # Only set password for new users
            if 'password' in data:
                password = data.pop('password')
                user = User(**data)
                user.password = password
                return user
        return data

class TimePeriodSchema(ma.SQLAlchemySchema):
    class Meta:
        model = TimePeriod
        load_instance = True
    
    id = ma.auto_field(dump_only=True)
    name = ma.auto_field(required=True)
    type = ma.auto_field(required=True)
    
    @validates('type')
    def validate_type(self, value):
        valid_types = ['bi-monthly', 'monthly', 'yearly']
        if value not in valid_types:
            raise ValidationError(f"Type must be one of: {', '.join(valid_types)}")

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
    
    # Add time_period relationship for nested serialization
    time_period = fields.Nested(TimePeriodSchema, dump_only=True)
    
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
    
    # Add time_period relationship for nested serialization
    time_period = fields.Nested(TimePeriodSchema, dump_only=True)
    
    @validates('amount')
    def validate_amount(self, value):
        if value <= 0:
            raise ValidationError("Amount must be greater than 0")

# Extended schemas with relationships for detailed views
class UserDataSchema(ma.SQLAlchemySchema):
    class Meta:
        model = User
    
    id = ma.auto_field()
    username = ma.auto_field()
    
    # Include relationships for the single API endpoint
    expenses = fields.List(fields.Nested(lambda: ExpenseSchema(exclude=('user_id',))))
    paychecks = fields.List(fields.Nested(lambda: PaycheckSchema(exclude=('user_id',))))
    
    # Include time periods through association proxies
    time_periods = fields.Method('get_time_periods')
    
    def get_time_periods(self, obj):
        # Get all unique time periods from expenses and paychecks
        time_periods = set()
        for expense in obj.expenses:
            time_periods.add(expense.time_period)
        for paycheck in obj.paychecks:
            time_periods.add(paycheck.time_period)
        return TimePeriodSchema(many=True).dump(time_periods)

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